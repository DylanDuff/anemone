//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { StyleSheet, View, type ViewStyle } from "react-native";
import { theme } from "./theme";

/** A thin rounded playback-progress bar. `fraction` is clamped to 0…1. */
export function ProgressBar({ fraction, style }: { fraction: number; style?: ViewStyle }) {
  const percent = Math.round(Math.min(1, Math.max(0, fraction)) * 100);
  return (
    <View style={[styles.track, style]}>
      <View style={[styles.fill, { width: `${percent}%` }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 4,
    borderRadius: theme.radii.pill,
    overflow: "hidden",
    backgroundColor: theme.colors.overlayStrong,
  },
  fill: {
    height: 4,
    backgroundColor: theme.colors.white,
  },
});
