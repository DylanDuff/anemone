//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type ReactNode, useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet } from "react-native";
import { useContentLayout } from "./contentLayout";
import { space } from "./theme";
import { useKeyboardShown } from "./useKeyboardShown";

/** Space between the dock and whatever it sits on (the pill, the keyboard, the screen edge). */
const DOCK_GAP = space(1.5);

/**
 * Controls pinned to the bottom of a page, within its side insets: resting just above the
 * navigation pill (or the safe area), and riding up to sit just above the software keyboard while
 * it's open, in step with its animation (the bottom pill slides away meanwhile). The page scrolls
 * beneath it — pad its content by `onHeight`'s value (see `dockClearance`).
 */
export function KeyboardDock({
  children,
  onHeight,
}: {
  children: ReactNode;
  /** The dock's own height, to keep the page's last content clear of it. */
  onHeight?: (height: number) => void;
}) {
  const { insetLeft, insetRight, insetBottom } = useContentLayout();
  const keyboard = useKeyboardShown();
  const lift = keyboard.shown ? keyboard.height : insetBottom;
  const offset = useRef(new Animated.Value(lift)).current;

  useEffect(() => {
    const animation = Animated.timing(offset, {
      toValue: lift,
      duration: keyboard.durationMs,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [lift, keyboard.durationMs, offset]);

  return (
    <Animated.View
      onLayout={(event) => onHeight?.(event.nativeEvent.layout.height)}
      style={[
        styles.dock,
        {
          left: insetLeft,
          right: insetRight,
          transform: [{ translateY: Animated.multiply(offset, -1) }],
        },
      ]}
    >
      {children}
    </Animated.View>
  );
}

/** Bottom padding that keeps a page's last content clear of a resting dock of `height`. */
export function dockClearance(height: number): number {
  return height + DOCK_GAP * 2;
}

const styles = StyleSheet.create({
  dock: {
    position: "absolute",
    bottom: DOCK_GAP,
  },
});
