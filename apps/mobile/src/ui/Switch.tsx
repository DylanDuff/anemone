//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { Host, Switch as NativeSwitch } from "@expo/ui";
import { StyleSheet, View } from "react-native";
import { nativeControls } from "./nativeControls";
import { theme } from "./theme";

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 22;

/**
 * An on/off switch. With `nativeControls` it's the platform's own (tinted with the accent) and
 * handles its own presses; otherwise it's a themed track and thumb that only *shows* the value —
 * the enclosing focus target (e.g. `ToggleRow`) does the toggling.
 */
export function Switch({
  value,
  onValueChange,
}: {
  value: boolean;
  onValueChange: (value: boolean) => void;
}) {
  if (nativeControls) {
    return (
      <Host matchContents colorScheme="dark" seedColor={theme.colors.accent}>
        <NativeSwitch value={value} onValueChange={onValueChange} />
      </Host>
    );
  }
  return (
    <View style={[styles.track, value ? styles.trackOn : null]}>
      <View style={[styles.thumb, value ? styles.thumbOn : null]} />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: theme.radii.pill,
    padding: (TRACK_HEIGHT - THUMB_SIZE) / 2,
    backgroundColor: theme.colors.placeholder,
  },
  trackOn: {
    backgroundColor: theme.colors.accent,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.white,
  },
  thumbOn: {
    alignSelf: "flex-end",
  },
});
