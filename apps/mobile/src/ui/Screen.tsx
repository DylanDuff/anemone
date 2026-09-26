//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useContentLayout } from "./contentLayout";
import { space, theme } from "./theme";

/** A padded, scrollable form page with a title — the connect / sign-in steps before a session. */
export function Screen({ title, children }: { title: string; children: ReactNode }) {
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
      <Text style={styles.title}>{title}</Text>
      {children}
    </ScrollView>
  );
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
  title: {
    ...theme.type.title,
    color: theme.colors.text,
    marginBottom: space(1),
  },
  note: {
    ...theme.type.callout,
    color: theme.colors.muted,
  },
  error: {
    color: theme.colors.error,
  },
});
