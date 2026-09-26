//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { Api } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { useCallback, useEffect, useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useContentLayout } from "./contentLayout";
import { Crossfade } from "./Crossfade";
import { Focusable, FocusWithin } from "./Focusable";
import { GlassScope } from "./Glass";
import {
  captionOffset,
  HERO_AUTO_ADVANCE_MS,
  heroGeometry,
  heroStyles,
  SlideArtwork,
  SlideDots,
} from "./HeroSlide";
import { ItemTitleBlock } from "./ItemTitleBlock";
import { FocusGuide, type RemoteEvent, useRemoteEvents } from "./tv";


/**
 * The home hero for TV, as three focus levels stacked top to bottom — matching what you see:
 *
 * 1. **The actions** — Play · ✓ · ♥ · ⓘ. Where focus starts. Left/right move between buttons;
 *    left from the first reaches the section rail.
 * 2. **The slide control** — the pagination dots, one press down. Left/right change slide
 *    (trapped, so they never leave it); ‹ › appear beside the dots while it's focused. Select opens
 *    the item.
 * 3. **The rows** below the hero.
 *
 * Up/down follow that order through plain geometry. Only the current slide is mounted (slides
 * crossfade), and auto-advance pauses while focus is anywhere in the hero.
 */
export function TVHero({
  api,
  items,
  onPressItem,
}: {
  api: Api;
  items: readonly BaseItemDto[];
  onPressItem?: (item: BaseItemDto) => void;
}) {
  const { width, insetLeft, insetRight } = useContentLayout();
  const geometry = heroGeometry(width);
  const [active, setActive] = useState(0);
  const [focusedWithin, setFocusedWithin] = useState(false);
  const [slideFocused, setSlideFocused] = useState(false);
  // Play claims focus when the hero first appears, then never again — so a slide change (which can
  // remount the Play button) doesn't pull focus back from the rows.
  const [claimInitialFocus, setClaimInitialFocus] = useState(true);
  const slideFocusedRef = useRef(false);

  const count = items.length;
  const step = useCallback(
    (delta: number) => setActive((index) => (index + delta + count) % count),
    [count],
  );

  useEffect(() => {
    if (count <= 1 || focusedWithin) {
      return;
    }
    const timer = setInterval(() => step(1), HERO_AUTO_ADVANCE_MS);
    return () => clearInterval(timer);
  }, [count, focusedWithin, step]);

  useRemoteEvents((event: RemoteEvent) => {
    if (!slideFocusedRef.current) {
      return;
    }
    if (event.eventType === "left") {
      step(-1);
    } else if (event.eventType === "right") {
      step(1);
    }
  });

  const item = items[Math.min(active, count - 1)];
  if (!item) {
    return <View style={{ height: geometry.height }} />;
  }

  const setSlideFocus = (focused: boolean) => {
    slideFocusedRef.current = focused;
    setSlideFocused(focused);
  };

  return (
    <FocusWithin
      onFocusChange={(within) => {
        setFocusedWithin(within);
        if (within) {
          setClaimInitialFocus(false);
        }
      }}
    >
      <View>
        <GlassScope>
          <View style={{ height: geometry.slideHeight }}>
            <Crossfade contentKey={item.Id ?? String(active)} style={StyleSheet.absoluteFill}>
              <SlideArtwork api={api} item={item} width={width} geometry={geometry} />
            </Crossfade>

            {/* Level 1: the actions. */}
            <FocusGuide
              autoFocus
              style={[
                heroStyles.caption,
                { bottom: captionOffset(geometry), left: insetLeft, right: insetRight },
              ]}
            >
              <ItemTitleBlock
                api={api}
                item={item}
                preferFocus={claimInitialFocus}
                onOpenDetails={onPressItem}
              />
            </FocusGuide>
          </View>
        </GlassScope>

        {/* Pull what follows back up over the glow's spill, so it leaks under the rows. */}
        <View style={{ marginTop: -geometry.spill }}>
          {/* Level 2: the slide control. Trapped left/right so those presses only change slide.
              Only with several slides — otherwise there's nothing to show or focus. */}
          {count > 1 ? (
            <FocusGuide trapFocusLeft trapFocusRight style={styles.slideControl}>
              <Focusable
                onPress={() => onPressItem?.(item)}
                onFocus={() => setSlideFocus(true)}
                onBlur={() => setSlideFocus(false)}
                accessibilityRole="adjustable"
                accessibilityLabel={`${item.Name ?? "Featured"}, slide ${active + 1} of ${count}`}
                style={styles.slideTarget}
              >
                <SlideDots items={items} active={active} emphasised={slideFocused} arrows />
              </Focusable>
            </FocusGuide>
          ) : null}
        </View>
      </View>
    </FocusWithin>
  );
}

const styles = StyleSheet.create({
  // Centred, sized to the dots (plus a little padding) so it's a clear, compact focus target.
  slideControl: {
    alignSelf: "center",
  },
  slideTarget: {
    paddingHorizontal: 12,
    paddingBottom: 8,
  },
});
