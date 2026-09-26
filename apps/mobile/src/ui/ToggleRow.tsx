//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { ReactNode } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Focusable } from "./Focusable";
import { nativeControls } from "./nativeControls";
import { Switch } from "./Switch";
import { space, theme } from "./theme";

/**
 * A settings row: label and description with an on/off switch. With native switches the switch is
 * the control (as in the platform's own settings); otherwise the whole row is one focus target, so
 * the D-pad (Select) or a click/tap toggles it.
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
  const content = (focused: boolean): ReactNode => (
    <>
      <View style={styles.text}>
        <Text style={[styles.label, focused ? styles.labelFocused : null]}>{label}</Text>
        {description ? (
          <Text style={[styles.description, focused ? styles.descriptionFocused : null]}>
            {description}
          </Text>
        ) : null}
      </View>
      <Switch value={value} onValueChange={onChange} />
    </>
  );

  if (nativeControls) {
    return <View style={[styles.row, nested ? styles.nested : null]}>{content(false)}</View>;
  }

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
      {({ focused }) => content(focused)}
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
});
