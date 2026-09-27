//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { StyleSheet, View } from "react-native";
import { Chip } from "../../ui/Chip";
import type { SettingOption } from "../../ui/settings";
import { space } from "../../ui/theme";

/** One chip per option, the selected one filled: a list page's filter. */
export function FilterChips<Value extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly SettingOption<Value>[];
  value: Value;
  onChange: (value: Value) => void;
}) {
  return (
    <View style={styles.chips}>
      {options.map((option) => (
        <Chip
          key={option.value}
          label={option.label}
          selected={option.value === value}
          onPress={() => onChange(option.value)}
        />
      ))}
    </View>
  );
}

/** A list page's toolbar: filter groups and actions, wrapping when narrow. */
export function AdminToolbar({ children }: { children: React.ReactNode }) {
  return <View style={styles.toolbar}>{children}</View>;
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space(2),
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space(1),
  },
});
