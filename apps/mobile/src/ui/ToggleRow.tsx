//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { StyleSheet, Text, View } from "react-native";
import { Focusable } from "./Focusable";
import { space, theme } from "./theme";

const TRACK_WIDTH = 48;
const TRACK_HEIGHT = 28;
const THUMB_SIZE = 22;

/**
 * A settings row: label and description with an on/off switch. The whole row is one focus target,
 * so the D-pad (Select) or a click/tap toggles it.
 */
export function ToggleRow({
  label,
  description,
  value,
  onChange,
  nested = false,
}: {
  label: string;
  description?: string;
  value: boolean;
  onChange: (value: boolean) => void;
  /** A sub-setting of the row above: indented to show it depends on it. */
  nested?: boolean;
}) {
  return (
    <Focusable
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      style={({ pressed, focused }) => [
        styles.row,
        nested ? styles.nested : null,
        focused ? styles.rowFocused : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {({ focused }) => (
        <>
          <View style={styles.text}>
            <Text style={[styles.label, focused ? styles.labelFocused : null]}>{label}</Text>
            {description ? (
              <Text style={[styles.description, focused ? styles.descriptionFocused : null]}>
                {description}
              </Text>
            ) : null}
          </View>
          <View style={[styles.track, value ? styles.trackOn : null]}>
            <View style={[styles.thumb, value ? styles.thumbOn : null]} />
          </View>
        </>
      )}
    </Focusable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(3),
    paddingVertical: space(2),
    paddingHorizontal: space(2.5),
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
  },
  nested: {
    marginLeft: space(4),
  },
  rowFocused: {
    backgroundColor: theme.colors.chipActive,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    flex: 1,
    gap: space(0.5),
  },
  label: {
    ...theme.type.label,
    color: theme.colors.text,
  },
  labelFocused: {
    color: theme.colors.chipActiveText,
  },
  description: {
    ...theme.type.caption,
    color: theme.colors.muted,
  },
  descriptionFocused: {
    color: theme.colors.chipActiveMuted,
  },
  track: {
    width: TRACK_WIDTH,
    height: TRACK_HEIGHT,
    borderRadius: TRACK_HEIGHT / 2,
    padding: (TRACK_HEIGHT - THUMB_SIZE) / 2,
    backgroundColor: theme.colors.placeholder,
  },
  trackOn: {
    backgroundColor: theme.colors.accent,
  },
  thumb: {
    width: THUMB_SIZE,
    height: THUMB_SIZE,
    borderRadius: THUMB_SIZE / 2,
    backgroundColor: theme.colors.white,
  },
  thumbOn: {
    alignSelf: "flex-end",
  },
});
