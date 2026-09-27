//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { StyleSheet, Text } from "react-native";
import { useAppNavigation } from "../navigation/routes";
import { useGlassButtons } from "../settings";
import { Focusable } from "./Focusable";
import { GlassFill, glassFillHost } from "./Glass";
import { Icon } from "./Icon";
import { space, theme } from "./theme";
import { isTV } from "./tv";

/**
 * Goes back, or home when there is no history (e.g. a deep link / refreshed web URL). Its frosted
 * pill keeps it legible when floated over artwork. `compact` is a glass chevron-only circle the
 * height of a page title: a sub-page's title (`PageHeader`) and the item hero's Back, where its
 * glass blurs the artwork. Glass follows Settings → Glass buttons. Hidden on TV, where the remote's
 * Back does this.
 */
export function BackButton({ compact = false }: { compact?: boolean }) {
  const navigation = useAppNavigation();
  const glass = useGlassButtons() && compact;
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
        compact ? styles.compact : styles.button,
        glass && !focused ? glassFillHost : null,
        focused ? styles.focused : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {({ focused }) => (
        <>
          {glass && !focused ? <GlassFill radius={COMPACT_BACK_SIZE / 2} /> : null}
          <Icon name="chevron-back" size={compact ? COMPACT_ICON_SIZE : 16} />
          {compact ? null : <Text style={styles.label}>Back</Text>}
        </>
      )}
    </Focusable>
  );
}

/** The compact button matches a page title's line height (`PageHeader`). */
export const COMPACT_BACK_SIZE = space(5.5);
const COMPACT_ICON_SIZE = 24;

const styles = StyleSheet.create({
  compact: {
    width: COMPACT_BACK_SIZE,
    height: COMPACT_BACK_SIZE,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.overlaySoft,
  },
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
