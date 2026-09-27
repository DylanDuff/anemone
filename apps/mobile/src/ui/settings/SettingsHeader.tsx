//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { useNavigation } from "@react-navigation/native";
import { useEffect } from "react";
import { StyleSheet, Text, View } from "react-native";
import { BackButton } from "../BackButton";
import { space, theme } from "../theme";

/** Top padding of a settings page, below `insetTop`. */
export const SETTINGS_PADDING_TOP = space(4);
/** Bottom padding of a settings page, above `insetBottom`. */
export const SETTINGS_PADDING_BOTTOM = space(6);
/** Widest a settings page's content grows on large screens. */
export const SETTINGS_MAX_WIDTH = 900;

/** A settings page's Back button (sub-pages) and title; also names the screen (web tab title). */
export function SettingsHeader({ title, back = false }: { title: string; back?: boolean }) {
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  return (
    <View style={styles.header}>
      {back ? <BackButton /> : null}
      <Text style={styles.title}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: space(2),
  },
  title: {
    ...theme.type.title,
    color: theme.colors.text,
  },
});
