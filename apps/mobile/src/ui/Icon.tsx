//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import Ionicons from "@expo/vector-icons/Ionicons";
import type { ComponentProps } from "react";
import type { StyleProp, TextStyle } from "react-native";
import { theme } from "./theme";

/** Any Ionicons glyph name (https://icons.expo.fyi, filter by Ionicons). */
export type IconName = ComponentProps<typeof Ionicons>["name"];

/**
 * The app's single icon component (Ionicons). Import this rather than an icon set directly, so the
 * set can change in one place.
 */
export function Icon({
  name,
  size = 20,
  color = theme.colors.text,
  style,
}: {
  name: IconName;
  size?: number;
  color?: string;
  style?: StyleProp<TextStyle>;
}) {
  return <Ionicons name={name} size={size} color={color} style={style} />;
}

/**
 * Ionicons ship each glyph as filled (`home`) and outline (`home-outline`); `base` is the filled
 * name. Outline reads as "available", filled as "current" — e.g. the active section.
 */
export function iconVariant(base: string, filled: boolean): IconName {
  return (filled ? base : `${base}-outline`) as IconName;
}
