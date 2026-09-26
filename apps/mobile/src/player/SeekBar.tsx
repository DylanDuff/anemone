//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { formatClock } from "@anemone/core";
import { useRef } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Focusable } from "../ui/Focusable";
import { space, theme } from "../ui/theme";

/**
 * Elapsed / remaining times around a progress track. Tap or click the track to jump there; on TV
 * it takes focus, and the player seeks with left/right while it's focused (`onFocusChange`).
 */
export function SeekBar({
  position,
  duration,
  onSeek,
  onFocusChange,
}: {
  position: number;
  duration: number;
  onSeek: (seconds: number) => void;
  onFocusChange: (focused: boolean) => void;
}) {
  const width = useRef(0);
  const fraction = duration > 0 ? Math.min(1, Math.max(0, position / duration)) : 0;

  return (
    <View style={styles.row}>
      <Text style={styles.time}>{formatClock(position, duration)}</Text>
      <Focusable
        accessibilityRole="adjustable"
        accessibilityLabel="Playback position"
        accessibilityValue={{ min: 0, max: Math.round(duration), now: Math.round(position) }}
        onLayout={(event) => {
          width.current = event.nativeEvent.layout.width;
        }}
        onPress={(event) => {
          // Native reports `locationX`; react-native-web passes the DOM click, which has `offsetX`.
          const native = event.nativeEvent as { locationX?: number; offsetX?: number };
          const x = native.locationX ?? native.offsetX;
          if (x !== undefined && Number.isFinite(x) && width.current > 0 && duration > 0) {
            onSeek((x / width.current) * duration);
          }
        }}
        onFocus={() => onFocusChange(true)}
        onBlur={() => onFocusChange(false)}
        style={styles.hitArea}
      >
        {({ focused }) => (
          // Not a touch target itself, so `locationX` is always relative to the full-width hit area.
          <View pointerEvents="none" style={[styles.track, focused ? styles.trackFocused : null]}>
            <View style={[styles.fill, { width: `${fraction * 100}%` }]} />
            <View
              style={[
                styles.thumb,
                focused ? styles.thumbFocused : null,
                { left: `${fraction * 100}%` },
              ]}
            />
          </View>
        )}
      </Focusable>
      <Text style={styles.time}>-{formatClock(duration - position, duration)}</Text>
    </View>
  );
}

const THUMB = 14;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(1.5),
  },
  time: {
    ...theme.type.caption,
    color: theme.colors.text,
    fontVariant: ["tabular-nums"],
    minWidth: 52,
    textAlign: "center",
  },
  hitArea: {
    flex: 1,
    justifyContent: "center",
    paddingVertical: space(1.5),
  },
  track: {
    height: 4,
    borderRadius: theme.radii.hairline,
    backgroundColor: theme.colors.track,
  },
  trackFocused: {
    height: 6,
    borderRadius: theme.radii.xs,
  },
  fill: {
    height: "100%",
    borderRadius: theme.radii.xs,
    backgroundColor: theme.colors.white,
  },
  thumb: {
    position: "absolute",
    top: "50%",
    width: THUMB,
    height: THUMB,
    marginLeft: -THUMB / 2,
    marginTop: -THUMB / 2,
    borderRadius: THUMB / 2,
    backgroundColor: theme.colors.white,
    opacity: 0,
  },
  thumbFocused: {
    opacity: 1,
  },
});
