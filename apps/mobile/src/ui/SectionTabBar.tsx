//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import type { Section } from "../navigation/routes";
import type { SectionEntry } from "../navigation/sections";
import { Focusable } from "./Focusable";
import { Icon, iconVariant } from "./Icon";
import { space, theme } from "./theme";

/**
 * The section switcher on narrow phones: a bottom tab bar with the same destinations as the rail.
 * Scrolls horizontally if a server has more libraries than fit.
 */
export function SectionTabBar({
  entries,
  onSelect,
}: {
  entries: readonly SectionEntry[];
  onSelect: (section: Section) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, space(1)) }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.tabs}
      >
        {entries.map((entry) => (
          <Focusable
            key={entry.key}
            onPress={() => onSelect(entry.section)}
            accessibilityRole="tab"
            accessibilityLabel={entry.label}
            accessibilityState={{ selected: entry.active }}
            style={({ pressed }) => [styles.tab, pressed ? styles.pressed : null]}
          >
            <Icon
              name={iconVariant(entry.icon, entry.active)}
              size={22}
              color={entry.active ? theme.colors.text : theme.colors.muted}
            />
            <Text
              numberOfLines={1}
              style={[styles.label, entry.active ? styles.labelActive : null]}
            >
              {entry.label}
            </Text>
            <View style={[styles.indicator, entry.active ? styles.indicatorActive : null]} />
          </Focusable>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: theme.colors.placeholder,
    backgroundColor: theme.colors.background,
    paddingTop: space(1),
  },
  tabs: {
    flexGrow: 1,
    justifyContent: "space-around",
    paddingHorizontal: space(1),
  },
  tab: {
    minWidth: 72,
    alignItems: "center",
    paddingHorizontal: space(1),
    gap: space(0.25),
  },
  pressed: {
    opacity: 0.6,
  },
  label: {
    color: theme.colors.muted,
    fontSize: 11,
    fontWeight: "500",
  },
  labelActive: {
    color: theme.colors.text,
  },
  indicator: {
    width: 18,
    height: 3,
    borderRadius: 2,
    marginTop: space(0.25),
  },
  indicatorActive: {
    backgroundColor: theme.colors.accent,
  },
});
