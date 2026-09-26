//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import { focusGlow, hoverTransition, useFocusIndicator } from "./Focusable";
import { theme } from "./theme";

/** Initials fill about a quarter of the circle's diameter at the `title` weight. */
const INITIALS_SCALE = 0.25;

function initials(name: string | null | undefined): string {
  return (name ?? "?")
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * A round photo over the name's initials (shown when there's no image, or while it loads) — people
 * and user accounts. `children` draw inside the clipped circle (the focus ring).
 */
export function Avatar({
  name,
  imageURL,
  size,
  focused = false,
  children,
}: {
  name: string | null | undefined;
  imageURL: string | undefined;
  size: number;
  focused?: boolean;
  children?: ReactNode;
}) {
  const indicator = useFocusIndicator();
  return (
    <View
      style={[
        styles.circle,
        { width: size, height: size },
        hoverTransition,
        focusGlow(indicator, focused),
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * INITIALS_SCALE }]}>{initials(name)}</Text>
      {imageURL ? <Image source={{ uri: imageURL }} style={styles.image} resizeMode="cover" /> : null}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    borderRadius: theme.radii.pill,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.placeholder,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  initials: {
    ...theme.type.title,
    color: theme.colors.muted,
  },
});
