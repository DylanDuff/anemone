//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { StyleSheet, Text, View } from "react-native";
import { useAccent, useGlassButtons } from "../settings";
import { Focusable, focusLift } from "./Focusable";
import { GlassFill, glassFillHost } from "./Glass";
import { Icon, type IconName } from "./Icon";
import { space, theme } from "./theme";

/**
 * A pill-shaped toggle used for sort fields, filters, seasons and view toggles. Selected chips are
 * accent-filled; the focused chip is white, so focus stays distinguishable from selection on TV.
 * `glass` frosts resting chips like the action buttons (Settings → Glass buttons).
 */
export function Chip({
  label,
  icon,
  selected = false,
  glass = false,
  onPress,
  accessibilityLabel,
}: {
  /** Omit for an icon-only chip (then give an `accessibilityLabel`). */
  label?: string;
  icon?: IconName;
  selected?: boolean;
  glass?: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
}) {
  const frosted = useGlassButtons() && glass && !selected;
  const accent = useAccent();
  return (
    <Focusable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={accessibilityLabel ?? label}
      style={({ pressed, focused }) => [
        styles.chip,
        frosted && !focused ? glassFillHost : null,
        selected ? { backgroundColor: accent.color } : null,
        focused ? [styles.focused, focusLift] : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {({ focused }) => (
        <>
          {frosted && !focused ? <GlassFill radius={theme.radii.pill} /> : null}
          <ChipContent
            label={label}
            icon={icon}
            focused={focused}
            color={selected && !focused ? accent.onColor : undefined}
          />
        </>
      )}
    </Focusable>
  );
}

/**
 * A chip's look without its press handling, for native controls that own the tap themselves (the
 * trigger of a native menu, see `ChoiceMenu`).
 */
export function ChipFace({
  label,
  icon,
  glass = false,
}: {
  label?: string;
  icon?: IconName;
  glass?: boolean;
}) {
  const frosted = useGlassButtons() && glass;
  return (
    <View style={[styles.chip, frosted ? glassFillHost : null]}>
      {frosted ? <GlassFill radius={theme.radii.pill} /> : null}
      <ChipContent label={label} icon={icon} focused={false} />
    </View>
  );
}

function ChipContent({
  label,
  icon,
  focused,
  color: colorOverride,
}: {
  label?: string;
  icon?: IconName;
  focused: boolean;
  /** For a selected chip: the colour that reads on the accent. */
  color?: string;
}) {
  const color = colorOverride ?? (focused ? theme.colors.chipActiveText : theme.colors.text);
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
