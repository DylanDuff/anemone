//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { StyleSheet, Text, View } from "react-native";
import { Chip } from "./Chip";
import { space, theme } from "./theme";

/**
 * A settings row for picking one of a few options: label and description, then one chip per option
 * (the selected one filled). Each chip is its own focus target, so the D-pad moves between them.
 */
export function ChoiceRow<Value extends string>({
  label,
  description,
  options,
  value,
  onChange,
}: {
  label: string;
  description?: string;
  options: ReadonlyArray<{ value: Value; label: string }>;
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{label}</Text>
        {description ? <Text style={styles.description}>{description}</Text> : null}
      </View>
      <View style={styles.options}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space(3),
    paddingVertical: space(2),
    paddingHorizontal: space(2.5),
    borderRadius: theme.radius,
    backgroundColor: theme.colors.surface,
  },
  text: {
    flex: 1,
    minWidth: 220,
    gap: space(0.5),
  },
  label: {
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: "500",
  },
  description: {
    color: theme.colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  options: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space(1),
  },
});
