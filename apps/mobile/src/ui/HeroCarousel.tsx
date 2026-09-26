//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type Api, displayTitle } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type NativeScrollEvent,
  type NativeSyntheticEvent,
  ScrollView,
  View,
} from "react-native";
import {
  captionOffset,
  HERO_AUTO_ADVANCE_MS,
  heroGeometry,
  heroStyles,
  SlideArtwork,
  SlideDots,
} from "./HeroSlide";
import { useContentLayout, useIsCompact } from "./contentLayout";
import { Focusable } from "./Focusable";
import { GlassScope } from "./Glass";
import { ItemTitleBlock } from "./ItemTitleBlock";
import { isTV } from "./tv";
import { TVHero } from "./TVHero";

/**
 * The home hero: featured (recently added) items presented like the item page header. Touch and
 * pointer devices get a swipeable, auto-advancing carousel; TV gets a D-pad hero (`TVHero`).
 */
export function HeroCarousel(props: {
  api: Api;
  items: readonly BaseItemDto[];
  onPressItem?: (item: BaseItemDto) => void;
}) {
  return isTV ? <TVHero {...props} /> : <SwipeCarousel {...props} />;
}

/**
 * Full-bleed paging carousel. Each slide's ⓘ action opens the item; phones drop the actions (they
 * live on the item page) and make the whole slide the way in instead (a swipe cancels the tap).
 */
function SwipeCarousel({
  api,
  items,
  onPressItem,
}: {
  api: Api;
  items: readonly BaseItemDto[];
  onPressItem?: (item: BaseItemDto) => void;
}) {
  const { width, insetLeft, insetRight } = useContentLayout();
  const compact = useIsCompact();
  const geometry = heroGeometry(width);
  const scrollRef = useRef<ScrollView>(null);
  const indexRef = useRef(0);
  const [active, setActive] = useState(0);

  // Auto-advance only once the carousel has been still for a full interval: any scrolling (a swipe,
  // a trackpad, or our own advance) restarts the countdown from the slide it lands on, and a finger
  // resting on it holds it. So browsing by hand never fights the timer.
  const advanceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const dragging = useRef(false);
  const scheduleAdvance = useCallback(() => {
    clearTimeout(advanceTimer.current);
    if (items.length <= 1 || dragging.current) {
      return;
    }
    advanceTimer.current = setTimeout(() => {
      const next = (indexRef.current + 1) % items.length;
      scrollRef.current?.scrollTo({ x: next * width, animated: true });
    }, HERO_AUTO_ADVANCE_MS);
  }, [items.length, width]);

  useEffect(() => {
    scheduleAdvance();
    return () => clearTimeout(advanceTimer.current);
  }, [scheduleAdvance]);

  if (items.length === 0) {
    return <View style={{ height: geometry.height }} />;
  }

  const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const index = Math.round(event.nativeEvent.contentOffset.x / width);
    indexRef.current = index;
    if (index !== active) {
      setActive(index);
    }
    scheduleAdvance();
  };

  return (
    <View>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => {
          dragging.current = true;
          clearTimeout(advanceTimer.current);
        }}
        onScrollEndDrag={() => {
          dragging.current = false;
          scheduleAdvance();
        }}
      >
        {items.map((item, index) => (
          <GlassScope key={item.Id ?? index}>
            <Focusable
              onPress={compact ? () => onPressItem?.(item) : undefined}
              disabled={!compact}
              accessible={compact}
              accessibilityRole={compact ? "button" : undefined}
              accessibilityLabel={compact ? displayTitle(item) : undefined}
              style={{ width, height: geometry.slideHeight }}
            >
              <SlideArtwork api={api} item={item} width={width} geometry={geometry} />
              <View style={[
                heroStyles.caption,
                { bottom: captionOffset(geometry), left: insetLeft, right: insetRight },
              ]}>
                <ItemTitleBlock
                  api={api}
                  item={item}
                  // Phones: no actions (they're on the item page). Elsewhere neighbours stay mounted
                  // so actions are ready mid-swipe; the rest skip their play-target fetches.
                  showActions={!compact && Math.abs(index - active) <= 1}
                  onOpenDetails={onPressItem}
                />
              </View>
            </Focusable>
          </GlassScope>
        ))}
      </ScrollView>
      {/* Pull what follows back up over the glow's spill, so it leaks under the rows. */}
      <View style={{ marginTop: -geometry.spill }}>
        <SlideDots items={items} active={active} />
      </View>
    </View>
  );
}
