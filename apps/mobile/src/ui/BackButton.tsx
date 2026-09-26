//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { StyleSheet, Text } from "react-native";
import { useAppNavigation } from "../navigation/routes";
import { Focusable } from "./Focusable";
import { Icon } from "./Icon";
import { space, theme } from "./theme";
import { isTV } from "./tv";

/**
 * Goes back, or home when there is no history (e.g. a deep link / refreshed web URL). Its frosted
 * pill keeps it legible when floated over artwork. Hidden on TV, where the remote's Back does this.
 */
export function BackButton() {
  const navigation = useAppNavigation();
  if (isTV) {
    return null;
  }
  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.replace("Browse", { screen: "Home" });
    }
  };

  return (
    <Focusable
      onPress={goBack}
      accessibilityRole="button"
      accessibilityLabel="Back"
      style={({ pressed, focused }) => [
        styles.button,
        focused ? styles.focused : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Icon name="chevron-back" size={16} />
      <Text style={styles.label}>Back</Text>
    </Focusable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(0.5),
    alignSelf: "flex-start",
    paddingHorizontal: space(1.75),
    paddingVertical: space(0.875),
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.overlaySoft,
  },
  focused: {
    backgroundColor: theme.colors.overlayStrong,
  },
  pressed: {
    opacity: 0.7,
  },
  label: {
    ...theme.type.callout,
    color: theme.colors.text,
    fontWeight: theme.weight.medium,
  },
});
