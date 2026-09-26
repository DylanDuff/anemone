//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import MaskedView from "@react-native-masked-view/masked-view";
import type { ReactNode } from "react";
import { type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";
import { fadeMaskGradient } from "./fadeMaskGradient";

/**
 * Renders `children` fully opaque down to `solidUntil` (0…1 of the height), then dissolves them to
 * transparent at the bottom — revealing whatever is behind (the hero's glow), unlike a scrim that
 * paints a colour on top. Native: a `MaskedView` whose mask is a gradient (only its alpha counts).
 * Web: `BottomFade.web.tsx` uses CSS `mask-image`.
 */
export function BottomFade({
  solidUntil,
  style,
  children,
}: {
  solidUntil: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  return (
    <MaskedView
      style={style}
      maskElement={
        <View
          style={[
            StyleSheet.absoluteFill,
            { experimental_backgroundImage: fadeMaskGradient(solidUntil) },
          ]}
        />
      }
    >
      {children}
    </MaskedView>
  );
}
