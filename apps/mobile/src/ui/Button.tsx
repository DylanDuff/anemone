//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { Focusable, focusLift } from "./Focusable";
import { Icon, type IconName } from "./Icon";
import { space, theme } from "./theme";
import { useAccent } from "../settings";

type ButtonVariant = "primary" | "secondary" | "destructive" | "plain";

/**
 * A themed text button. `primary` is accent-filled, `secondary` a surface pill, `destructive`
 * red text on a surface pill, `plain` bare text. Focused buttons turn white (like chips), so D-pad
 * focus reads the same everywhere.
 */
export function Button({
  label,
  onPress,
  variant = "primary",
  icon,
  busy = false,
  disabled = false,
  preferFocus = false,
}: {
  label: string;
  onPress: () => void;
  variant?: ButtonVariant;
  icon?: IconName;
  /** Shows a spinner and ignores presses (e.g. while signing in). */
  busy?: boolean;
  disabled?: boolean;
  /** Take D-pad focus when it appears (TV), e.g. the confirm step of a destructive action. */
  preferFocus?: boolean;
}) {
  const inactive = busy || disabled;
  const accent = useAccent();
  const variantStyle =
    variant === "primary"
      ? { button: { backgroundColor: accent.color }, color: accent.onColor }
      : VARIANT_STYLES[variant];
  return (
    <Focusable
      onPress={onPress}
      disabled={inactive}
      hasTVPreferredFocus={preferFocus}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled: inactive, busy }}
      style={({ pressed, focused }) => [
        styles.button,
        variantStyle.button,
        focused ? [styles.focused, focusLift] : null,
        pressed || inactive ? styles.dimmed : null,
      ]}
    >
      {({ focused }) => {
        const color = focused ? theme.colors.chipActiveText : variantStyle.color;
        return (
          <>
            {busy ? (
              <ActivityIndicator size="small" color={color} />
            ) : icon ? (
              <Icon name={icon} size={18} color={color} />
            ) : null}
            <Text style={[styles.label, { color }]}>{label}</Text>
          </>
        );
      }}
    </Focusable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "flex-start",
    gap: space(1),
    paddingHorizontal: space(3),
    paddingVertical: space(1.5),
    borderRadius: theme.radii.pill,
  },
  focused: {
    backgroundColor: theme.colors.chipActive,
  },
  dimmed: {
    opacity: 0.6,
  },
  label: {
    ...theme.type.label,
  },
});

/** `primary` is filled with the accent at render time (see `Button`), so it's live. */
const VARIANT_STYLES: Record<ButtonVariant, { button: object; color: string }> = {
  primary: { button: {}, color: theme.colors.white },
  secondary: { button: { backgroundColor: theme.colors.surface }, color: theme.colors.text },
  destructive: { button: { backgroundColor: theme.colors.surface }, color: theme.colors.error },
  plain: { button: {}, color: theme.colors.muted },
};
