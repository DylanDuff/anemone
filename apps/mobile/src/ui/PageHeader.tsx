//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { useNavigation } from "@react-navigation/native";
import { type ReactNode, useEffect } from "react";
import { type StyleProp, StyleSheet, Text, View, type ViewStyle } from "react-native";
import { BackButton, COMPACT_BACK_SIZE } from "./BackButton";
import { useContentLayout } from "./contentLayout";
import { space, theme } from "./theme";
import { isTV } from "./tv";

/** Space between the top of the page's content area (`insetTop`) and its title. */
export const PAGE_PADDING_TOP = space(2);
/** Space below a page's last content, above `insetBottom`. */
export const PAGE_PADDING_BOTTOM = space(6);
/** Space between the title row and the header's accessory (search field, toolbar). */
const ACCESSORY_GAP = space(2);
/** Space between the header and the page's content. */
const HEADER_MARGIN_BOTTOM = space(3);

/**
 * The header every browse page starts with (Search, a library, Settings and its pages), so titles
 * and their controls land in the same place everywhere: `PAGE_PADDING_TOP` below the content
 * inset, a fixed-height title row, then the accessory (search field, filters, toolbar) a fixed gap
 * under it. Sub-pages show a glass Back chevron in place of the title (the page they came from
 * says where they are); on TV, where the remote goes back, they keep the title.
 * It scrolls with the page. The parent supplies the horizontal insets; the header owns the top
 * spacing (`insetTop` included), so pages shouldn't add their own. Also names the screen (the web
 * tab title).
 */
export function PageHeader({
  title,
  detail,
  back = false,
  action,
  children,
  style,
}: {
  title: string;
  /** A short note beside the title (a library's item count). */
  detail?: string;
  /** A sub-page: the Back chevron replaces the title (except on TV, where the remote goes back). */
  back?: boolean;
  /** A control at the far end of the title row (e.g. Search's "Clear recents"). */
  action?: ReactNode;
  /** The page's controls: a search field, filter chips, a toolbar. */
  children?: ReactNode;
  /** Spacing overrides for a host that spaces the header itself (the native settings lists). */
  style?: StyleProp<ViewStyle>;
}) {
  const { insetTop } = useContentLayout();
  const navigation = useNavigation();
  useEffect(() => {
    navigation.setOptions({ title });
  }, [navigation, title]);

  return (
    <View style={[styles.header, { paddingTop: PAGE_PADDING_TOP + insetTop }, style]}>
      <View style={styles.titleRow}>
        {back && !isTV ? (
          <BackButton compact />
        ) : (
          <>
            <Text style={styles.title} numberOfLines={1} accessibilityRole="header">
              {title}
            </Text>
            {detail ? <Text style={styles.detail}>{detail}</Text> : null}
          </>
        )}
        {action ? <View style={styles.action}>{action}</View> : null}
      </View>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: ACCESSORY_GAP,
    marginBottom: HEADER_MARGIN_BOTTOM,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(1.5),
    // Fixed so a Back chevron or detail never changes where the accessory starts.
    height: COMPACT_BACK_SIZE,
  },
  title: {
    ...theme.type.title,
    color: theme.colors.text,
    flexShrink: 1,
  },
  action: {
    marginLeft: "auto",
  },
  detail: {
    ...theme.type.callout,
    color: theme.colors.muted,
  },
});
