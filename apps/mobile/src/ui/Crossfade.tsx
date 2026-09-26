//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type ReactNode, useLayoutEffect, useRef, useState } from "react";
import { Animated, type StyleProp, StyleSheet, View, type ViewStyle } from "react-native";

interface Layer {
  readonly key: string;
  readonly node: ReactNode;
}

/**
 * Crossfades between contents identified by `contentKey`: when the key changes, the outgoing
 * content stays underneath while the new content fades in over it, then is dropped.
 */
export function Crossfade({
  contentKey,
  duration = 500,
  style,
  children,
}: {
  contentKey: string;
  duration?: number;
  style?: StyleProp<ViewStyle>;
  children: ReactNode;
}) {
  // The content from the last commit — i.e. what is on screen before this render.
  const committed = useRef<Layer>({ key: contentKey, node: children });
  const [outgoing, setOutgoing] = useState<Layer | null>(null);
  const opacity = useRef(new Animated.Value(1)).current;

  // Runs before the effect below, so `committed` still holds the previous content here.
  useLayoutEffect(() => {
    const previous = committed.current;
    if (previous.key === contentKey) {
      return;
    }
    setOutgoing(previous);
    opacity.setValue(0);
    const animation = Animated.timing(opacity, { toValue: 1, duration, useNativeDriver: true });
    animation.start(({ finished }) => {
      if (finished) {
        setOutgoing(null);
      }
    });
    return () => animation.stop();
  }, [contentKey, duration, opacity]);

  useLayoutEffect(() => {
    committed.current = { key: contentKey, node: children };
  });

  return (
    <View style={style}>
      {outgoing ? (
        <View key={outgoing.key} style={StyleSheet.absoluteFill}>
          {outgoing.node}
        </View>
      ) : null}
      <Animated.View key={contentKey} style={[StyleSheet.absoluteFill, { opacity }]}>
        {children}
      </Animated.View>
    </View>
  );
}
