//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { ReactNode } from "react";
import { type StyleProp, View, type ViewStyle } from "react-native";
import { fadeMaskGradient } from "./fadeMaskGradient";

/** Web version of `BottomFade.tsx`: the same dissolve via CSS `mask-image`. */
export function BottomFade({
  solidUntil,
  style,
  children,
}: {
  solidUntil: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const mask = fadeMaskGradient(solidUntil);
  // react-native-web passes unknown style keys through to CSS.
  const maskStyle = { maskImage: mask, WebkitMaskImage: mask } as ViewStyle;
  return <View style={[style, maskStyle]}>{children}</View>;
}
