//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type Api, backdropImageSource } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { StyleSheet } from "react-native";
import { Artwork } from "./Artwork";
import { BottomFade } from "./BottomFade";
import { useHeroGlowSetting } from "../settings";

/** Tuning knobs for the glow. */
export const GLOW = {
  /** Blur in px. Huge on purpose: only the slide's colour masses should survive. */
  blurRadius: 90,
  /** How far below the slide's top the glow reaches, as a multiple of the hero height. */
  reach: 1.5,
  /** Overall strength, so the rows on top stay legible. */
  opacity: 0.8,
  /** Heavy blur averages colours toward grey; push saturation back so it reads as light. */
  filter: "saturate(1.8) brightness(0.8)",
  /** The image is tiny — a blur this heavy discards all detail anyway. */
  sourceWidth: 320,
  /** Where the glow starts dissolving (fraction of its height); it is fully gone at the bottom. */
  fadeFrom: 0.4,
} as const;

/**
 * A slide's ambient glow: its backdrop, heavily blurred, filling the slide and spilling below the
 * hero so its colour leaks into the rows. Rendered *inside* the slide, behind its artwork, so it is
 * part of the slide and moves with it — there is no separate layer to keep in sync.
 */
export function SlideGlow({ api, item, height }: { api: Api; item: BaseItemDto; height: number }) {
  const url = backdropImageSource(api, item, { maxWidth: GLOW.sourceWidth }).url;
  // The Settings "Hero glow" toggle.
  const { value: glowEnabled } = useHeroGlowSetting();
  if (!glowEnabled || !url) {
    return null;
  }

  // Dissolve to transparent (not to the page colour) so the glow never ends in a visible edge,
  // whatever sits beneath it.
  return (
    <BottomFade solidUntil={GLOW.fadeFrom} style={[styles.container, { height }]}>
      <Artwork uri={url} blurRadius={GLOW.blurRadius} style={styles.image} />
    </BottomFade>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    opacity: GLOW.opacity,
    pointerEvents: "none",
    // Clipped to the slide, so during a swipe the glow's edge is exactly the slide's edge.
    overflow: "hidden",
  },
  image: {
    ...StyleSheet.absoluteFill,
    // Oversize so the blur's soft, darkened edges fall outside the clipped area.
    transform: [{ scale: 1.25 }],
    filter: GLOW.filter,
  },
});
