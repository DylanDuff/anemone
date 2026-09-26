//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { Platform, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";

/** Stop positions along an ease-in curve (alpha = t²) so the top stays clear and the base is solid. */
const STOPS = [0, 0.25, 0.5, 0.75, 1];

/** `#rrggbb` → `rgba(r, g, b, alpha)`; the gradient needs the colour itself fading, not black. */
function withAlpha(hex: string, alpha: number): string {
  const value = Number.parseInt(hex.replace("#", ""), 16);
  const red = (value >> 16) & 255;
  const green = (value >> 8) & 255;
  const blue = value & 255;
  return `rgba(${red}, ${green}, ${blue}, ${alpha.toFixed(3)})`;
}

function linearGradient(hex: string, endOpacity: number, toward: "top" | "bottom"): string {
  const stops = STOPS.map(
    (position) => `${withAlpha(hex, position ** 2 * endOpacity)} ${position * 100}%`,
  );
  return `linear-gradient(to ${toward}, ${stops.join(", ")})`;
}

/**
 * A continuous vertical fade from transparent to `color` at `endOpacity` (default solid), with the
 * colour at the bottom (`from="bottom"`, default) or the top; position it with `style`.
 * Web takes the CSS `backgroundImage` directly; native uses RN's `experimental_backgroundImage`
 * (New Architecture), which parses the same `linear-gradient` syntax.
 */
export function GradientScrim({
  color,
  endOpacity = 1,
  from = "bottom",
  style,
}: {
  color: string;
  endOpacity?: number;
  /** Which edge the colour sits at; it fades to transparent toward the other. */
  from?: "top" | "bottom";
  style?: StyleProp<ViewStyle>;
}) {
  const gradient = linearGradient(color, endOpacity, from === "bottom" ? "bottom" : "top");
  const gradientStyle = Platform.select<ViewStyle>({
    web: { backgroundImage: gradient } as ViewStyle,
    default: { experimental_backgroundImage: gradient },
  });

  return <View style={[styles.container, gradientStyle, style]} />;
}

const styles = StyleSheet.create({
  container: {
    pointerEvents: "none",
  },
});
