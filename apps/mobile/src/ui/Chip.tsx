//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { StyleSheet, Text, View } from "react-native";
import { Focusable, focusLift } from "./Focusable";
import { Icon, type IconName } from "./Icon";
import { space, theme } from "./theme";

/**
 * A pill-shaped toggle used for sort fields, filters, seasons and view toggles. Selected chips are
 * accent-filled; the focused chip is white, so focus stays distinguishable from selection on TV.
 */
export function Chip({
  label,
  icon,
  selected = false,
  onPress,
  accessibilityLabel,
}: {
  /** Omit for an icon-only chip (then give an `accessibilityLabel`). */
  label?: string;
  icon?: IconName;
  selected?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  return (
    <Focusable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed, focused }) => [
        styles.chip,
        selected ? styles.selected : null,
        focused ? [styles.focused, focusLift] : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {({ focused }) => <ChipContent label={label} icon={icon} focused={focused} />}
    </Focusable>
  );
}

/**
 * A chip's look without its press handling, for native controls that own the tap themselves (the
 * trigger of a native menu, see `ChoiceMenu`).
 */
export function ChipFace({ label, icon }: { label?: string; icon?: IconName }) {
  return (
    <View style={styles.chip}>
      <ChipContent label={label} icon={icon} focused={false} />
    </View>
  );
}

function ChipContent({
  label,
  icon,
  focused,
}: {
  label?: string;
  icon?: IconName;
  focused: boolean;
}) {
  const color = focused ? theme.colors.chipActiveText : theme.colors.text;
  return (
    <>
      {icon ? <Icon name={icon} size={CHIP_ICON_SIZE} color={color} /> : null}
      {label ? <Text style={[styles.label, { color }]}>{label}</Text> : null}
    </>
  );
}

const CHIP_ICON_SIZE = 15;

const styles = StyleSheet.create({
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(0.75),
    paddingHorizontal: space(1.75),
    paddingVertical: space(0.875),
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.chip,
  },
  selected: {
    backgroundColor: theme.colors.accent,
  },
  focused: {
    backgroundColor: theme.colors.chipActive,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    ...theme.type.caption,
    fontWeight: theme.weight.medium,
  },
});
