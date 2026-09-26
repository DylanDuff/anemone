//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContentLayout } from "./contentLayout";
import { space, theme } from "./theme";

/**
 * A padded, scrollable page with a title — the connect / sign-in / user-picker steps before a
 * session. `accessory` sits at the end of the title row (e.g. an Edit toggle).
 */
export function Screen({
  title,
  accessory,
  children,
}: {
  title: string;
  accessory?: ReactNode;
  children: ReactNode;
}) {
  const safeArea = useSafeAreaInsets();
  const { insetLeft, insetRight } = useContentLayout();
  return (
    <ScrollView
      style={styles.screen}
      keyboardShouldPersistTaps="handled"
      contentContainerStyle={[
        styles.content,
        {
          paddingTop: safeArea.top + space(6),
          paddingBottom: safeArea.bottom + space(6),
          paddingLeft: insetLeft,
          paddingRight: insetRight,
        },
      ]}
    >
      <View style={styles.titleRow}>
        <Text style={styles.title}>{title}</Text>
        {accessory}
      </View>
      {children}
    </ScrollView>
  );
}

/** A row of buttons on a form page (primary action first, then e.g. Back). */
export function ScreenActions({ children }: { children: ReactNode }) {
  return <View style={styles.actions}>{children}</View>;
}

/** Supporting text on a form page: a hint, or an error. */
export function ScreenNote({ children, error = false }: { children: ReactNode; error?: boolean }) {
  return <Text style={[styles.note, error ? styles.error : null]}>{children}</Text>;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    gap: space(2),
    maxWidth: 560,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space(2),
    marginBottom: space(1),
  },
  title: {
    ...theme.type.title,
    color: theme.colors.text,
    flexShrink: 1,
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(1),
  },
  note: {
    ...theme.type.callout,
    color: theme.colors.muted,
  },
  error: {
    color: theme.colors.error,
  },
});
