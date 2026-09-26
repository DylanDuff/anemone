//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { BlurTargetView, BlurView } from "expo-blur";
import { GlassView, isGlassEffectAPIAvailable, isLiquidGlassAvailable } from "expo-glass-effect";
import { createContext, type ReactNode, type RefObject, useContext, useRef } from "react";
import { Platform, type StyleProp, StyleSheet, useColorScheme, View, type ViewStyle } from "react-native";
import { useGlassBlurSetting } from "../settings";
import { theme } from "./theme";

/**
 * iOS 26+ Liquid Glass. Both checks are needed: the API can be missing on some iOS 26 betas even
 * where the design system reports glass as available.
 */
const liquidGlass = isLiquidGlassAvailable() && isGlassEffectAPIAvailable();

const BlurTargetContext = createContext<RefObject<View | null> | null>(null);

/**
 * Owns the blur target shared by a `GlassBackdrop` and the `GlassSurface`s floating over it. Wrap
 * both: the glass is a *sibling* of the backdrop (it can't blur itself), so the link can't come
 * from the backdrop's own subtree.
 */
export function GlassScope({ children }: { children: ReactNode }) {
  const target = useRef<View | null>(null);
  return <BlurTargetContext.Provider value={target}>{children}</BlurTargetContext.Provider>;
}

/**
 * Marks the content that the scope's `GlassSurface`s float over. Android's blur can only sample a
 * registered target; elsewhere this is a plain View. Must be inside a `GlassScope`, rendered before
 * the glass (so its ref is attached by the time the glass mounts).
 */
export function GlassBackdrop({
  style,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  // Always the blur target, even with blur off: swapping the element type would remount the whole
  // page beneath it (including the Settings screen doing the toggling).
  const target = useContext(BlurTargetContext);
  return (
    <BlurTargetView ref={target ?? undefined} style={style}>
      {children}
    </BlurTargetView>
  );
}

/**
 * A frosted surface: real Liquid Glass on iOS 26+, otherwise `BlurView` — a native blur of the
 * nearest `GlassBackdrop` on Android, `backdrop-filter` on web, a material on older iOS. A dark
 * tint keeps it legible over bright artwork in every mode; `tintInDarkMode` deepens it while the
 * device is in dark mode (`glassDarkTint`).
 */
export function GlassSurface({
  style,
  intensity = 60,
  blurReductionFactor,
  tintInDarkMode = false,
  children,
}: {
  style?: StyleProp<ViewStyle>;
  /**
   * Strength (1–100) for the `BlurView` fallback. Note it drives *both* the blur and the dark
   * tint's opacity (`intensity × 0.78%`), so high values also grey the surface out.
   */
  intensity?: number;
  /**
   * Android only: blur radius = `intensity / blurReductionFactor` (expo-blur default 4). Lower it
   * to get a stronger blur without raising the tint.
   */
  blurReductionFactor?: number;
  /** Darken the glass while the device's appearance is dark (the navigation pill). */
  tintInDarkMode?: boolean;
  children?: ReactNode;
}) {
  const blurTarget = useContext(BlurTargetContext);
  const darkTint = useColorScheme() === "dark" && tintInDarkMode;

  // The Settings "Glass blur" toggle; off renders a translucent tint (cheap on weak TV hardware).
  const { value: blurEnabled } = useGlassBlurSetting();
  if (!blurEnabled) {
    return <View style={[styles.clip, styles.tint, style]}>{children}</View>;
  }

  if (liquidGlass) {
    return (
      <GlassView
        glassEffectStyle="regular"
        colorScheme="dark"
        tintColor={darkTint ? theme.colors.glassDarkTint : undefined}
        style={style}
      >
        {children}
      </GlassView>
    );
  }

  return (
    <BlurView
      tint="dark"
      intensity={intensity}
      blurReductionFactor={blurReductionFactor}
      blurMethod="dimezisBlurViewSdk31Plus"
      blurTarget={blurTarget ?? undefined}
      style={[styles.clip, darkTint ? styles.darkTint : null, style]}
    >
      {children}
    </BlurView>
  );
}

/**
 * Frosted glass filling a small translucent element over artwork — buttons and detail chips
 * (Settings → Glass buttons). Render it as the element's first child, and give the element
 * `glassFillHost` in place of its translucent background. Blurs the nearest `GlassScope`'s
 * backdrop — the hero / header artwork.
 */
export function GlassFill({ radius }: { radius: number }) {
  return (
    <GlassSurface
      // expo-blur ties the dark tint to intensity (`intensity × 0.78%`) and, on Android, divides it
      // by a reduction factor for the radius. Moderate intensity keeps the tint light (~19%); a low
      // reduction factor still gives a real blur (radius ≈ 15). A thin edge defines the glass.
      intensity={GLASS_FILL_INTENSITY}
      blurReductionFactor={GLASS_FILL_REDUCTION}
      style={[StyleSheet.absoluteFill, styles.fillEdge, styles.fillBehind, { borderRadius: radius }]}
    />
  );
}

const GLASS_FILL_INTENSITY = 24;
const GLASS_FILL_REDUCTION = 1.6;

const styles = StyleSheet.create({
  fillEdge: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.borderStrong,
  },
  // Safari composites `backdrop-filter` layers out of paint order at times, drawing the blur over
  // the host's icon. Pin it beneath the host's content (the host is a stacking context, below).
  fillBehind: Platform.OS === "web" ? { zIndex: -1 } : {},
  // BlurView doesn't clip its own blur to borderRadius without this.
  clip: {
    overflow: "hidden",
  },
  tint: {
    backgroundColor: theme.colors.glassTint,
  },
  darkTint: {
    backgroundColor: theme.colors.glassDarkTint,
  },
});

/** For an element hosting a `GlassFill`: drop its translucent fill and clip the blur to its shape. */
export const glassFillHost: ViewStyle = {
  backgroundColor: "transparent",
  overflow: "hidden",
  // Web: its own stacking context, so the fill's negative z-index stays inside it.
  ...(Platform.OS === "web" ? { zIndex: 0 } : null),
};
