//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type ReactNode, useEffect, useRef, useState } from "react";
import { Animated, Easing, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";

const OPEN_DURATION_MS = 280;
const CLOSE_DURATION_MS = 200;
/** How far the contents settle downward as they fade in. */
const CONTENT_DROP = 6;

/**
 * Reveals `children` by growing to their height, fading them in just behind the growth; closing
 * reverses it, then unmounts them. Height follows the contents while open (e.g. data arriving).
 * `contentStyle` spacing (padding) is part of what grows, so gaps open smoothly too.
 */
export function Collapsible({
  open,
  contentStyle,
  children,
}: {
  open: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  const [mounted, setMounted] = useState(open);
  const [contentHeight, setContentHeight] = useState<number>();
  const progress = useRef(new Animated.Value(open ? 1 : 0)).current;

  if (open && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    // Opening waits for the first measurement, so it knows how far to grow.
    if (open && contentHeight == null) {
      return;
    }
    const animation = Animated.timing(progress, {
      toValue: open ? 1 : 0,
      duration: open ? OPEN_DURATION_MS : CLOSE_DURATION_MS,
      easing: open ? Easing.out(Easing.cubic) : Easing.in(Easing.cubic),
      // Height can't run on the native driver; keep both on JS so they share one value.
      useNativeDriver: false,
    });
    animation.start(({ finished }) => {
      if (finished && !open) {
        setMounted(false);
      }
    });
    return () => animation.stop();
  }, [open, contentHeight == null, progress]);

  if (!mounted) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.clip,
        { height: progress.interpolate({ inputRange: [0, 1], outputRange: [0, contentHeight ?? 0] }) },
      ]}
    >
      <Animated.View
        onLayout={(event) => setContentHeight(event.nativeEvent.layout.height)}
        style={[
          contentStyle,
          {
            opacity: progress.interpolate({ inputRange: [0.35, 1], outputRange: [0, 1], extrapolate: "clamp" }),
            transform: [
              {
                translateY: progress.interpolate({
                  inputRange: [0, 1],
                  outputRange: [-CONTENT_DROP, 0],
                }),
              },
            ],
          },
        ]}
      >
        {children}
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  clip: {
    overflow: "hidden",
  },
});
