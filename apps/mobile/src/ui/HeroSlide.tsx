//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// The pieces shared by the touch carousel (`HeroCarousel`) and the D-pad hero (`TVHero`): hero
// geometry, one slide's artwork (glow + backdrop), and the page dots.
//

import { type Api, backdropImageSource } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { StyleSheet, View } from "react-native";
import { Artwork } from "./Artwork";
import { BottomFade } from "./BottomFade";
import { GlassBackdrop } from "./Glass";
import { Icon } from "./Icon";
import { GLOW, SlideGlow } from "./HeroGlow";
import { cinematicHeight } from "./ItemTitleBlock";
import { space, theme } from "./theme";
import { imagePixelWidth } from "./imageSize";

export const HERO_AUTO_ADVANCE_MS = 6000;

/** Where the slide starts dissolving into the glow behind it (fraction of the hero height). */
const SLIDE_SOLID_UNTIL = 0.55;

export interface HeroGeometry {
  /** The visible hero. */
  readonly height: number;
  /** Slide height including the glow's spill below the hero. */
  readonly slideHeight: number;
  /** How far the glow spills below the hero; what follows the hero is pulled up by this. */
  readonly spill: number;
}

export function heroGeometry(width: number): HeroGeometry {
  const height = cinematicHeight(width);
  const slideHeight = Math.round(height * GLOW.reach);
  return { height, slideHeight, spill: slideHeight - height };
}

/**
 * One slide's artwork: its blurred glow spilling below, and the backdrop dissolving into it.
 * Decorative only — the item is opened from the ⓘ action in the slide's title block.
 */
export function SlideArtwork({
  api,
  item,
  width,
  geometry,
}: {
  api: Api;
  item: BaseItemDto;
  width: number;
  geometry: HeroGeometry;
}) {
  const backdrop = backdropImageSource(api, item, { maxWidth: imagePixelWidth(width) });

  // The backdrop the slide's glass buttons blur (Settings → Glass buttons); render the slide's
  // caption inside the same `GlassScope`.
  return (
    <GlassBackdrop style={StyleSheet.absoluteFill}>
      <SlideGlow api={api} item={item} height={geometry.slideHeight} />
      <BottomFade
        solidUntil={SLIDE_SOLID_UNTIL}
        style={[styles.artwork, { height: geometry.height }]}
      >
        {backdrop.url ? (
          <Artwork uri={backdrop.url} blurHash={backdrop.blurHash} style={styles.image} />
        ) : (
          <View style={[styles.image, styles.placeholder]} />
        )}
        <View style={styles.scrim} />
      </BottomFade>
    </GlassBackdrop>
  );
}

/**
 * Page indicator under the hero. `emphasised` (the TV slide has focus) brightens it; with
 * `arrows`, small ‹ › sit either side of the dots and appear while emphasised, signalling that
 * left/right will change slide. They're always laid out (just transparent) so the dots never shift.
 */
export function SlideDots({
  items,
  active,
  emphasised = false,
  arrows = false,
}: {
  items: readonly BaseItemDto[];
  active: number;
  emphasised?: boolean;
  arrows?: boolean;
}) {
  if (items.length <= 1) {
    return null;
  }
  const arrow = (name: "chevron-back" | "chevron-forward") =>
    arrows ? (
      <Icon
        name={name}
        size={DOT_ARROW_SIZE}
        color={theme.colors.white}
        style={{ opacity: emphasised ? 1 : 0 }}
      />
    ) : null;

  return (
    <View style={styles.dots}>
      {arrow("chevron-back")}
      {items.map((item, index) => (
        <View
          key={item.Id ?? index}
          style={[
            styles.dot,
            emphasised ? styles.dotEmphasised : null,
            index === active ? (emphasised ? styles.dotActiveEmphasised : styles.dotActive) : null,
          ]}
        />
      ))}
      {arrow("chevron-forward")}
    </View>
  );
}

/** Matches the dots' visual height, so the arrows read as part of the indicator. */
const DOT_ARROW_SIZE = 12;

export const heroStyles = StyleSheet.create({
  // `bottom`, `left` and `right` are set inline: above the glow's spill, inside the page insets
  // (the artwork bleeds full width, the caption clears the section rail).
  caption: {
    position: "absolute",
    // Swipes on empty caption space reach the carousel underneath.
    pointerEvents: "box-none",
  },
});

export function captionOffset(geometry: HeroGeometry): number {
  return geometry.spill + space(5);
}

const styles = StyleSheet.create({
  image: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.placeholder,
  },
  placeholder: {
    backgroundColor: theme.colors.surface,
  },
  scrim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: theme.colors.overlaySoft,
  },
  artwork: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
  },
  dots: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(0.75),
    justifyContent: "center",
    marginTop: space(1.5),
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.dot,
  },
  dotActive: {
    backgroundColor: theme.colors.accent,
    width: 20,
  },
  dotEmphasised: {
    backgroundColor: theme.colors.dotEmphasised,
  },
  dotActiveEmphasised: {
    backgroundColor: theme.colors.white,
    width: 28,
  },
});
