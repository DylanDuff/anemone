//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { ReactNode } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useContentLayout } from "./contentLayout";
import { Focusable, focusRoom } from "./Focusable";
import { Icon } from "./Icon";
import { space, theme } from "./theme";
import { FocusGuide } from "./tv";

/** A section title, optionally tappable with a "See all" affordance. */
export function SectionHeader({ title, onPress }: { title: string; onPress?: () => void }) {
  const insets = useInsetStyle();
  return (
    <Focusable onPress={onPress} disabled={!onPress} style={[styles.headerRow, insets]}>
      {({ focused }) => (
        <>
          <Text style={styles.header}>{title}</Text>
          {onPress ? (
            <View style={styles.seeAllRow}>
              <Text style={[styles.seeAll, focused ? styles.seeAllFocused : null]}>See all</Text>
              <Icon
                name="chevron-forward"
                size={14}
                color={focused ? theme.colors.text : theme.colors.muted}
              />
            </View>
          ) : null}
        </>
      )}
    </Focusable>
  );
}

/**
 * A titled, horizontally-scrolling row ("shelf") — the building block of the home and item pages.
 * Render nothing when there is nothing to show; callers decide emptiness. On TV the row is a focus
 * guide: moving into it returns to the item you last focused there, as TV apps expect.
 */
export function Shelf({
  title,
  onPressTitle,
  gap = space(1.5),
  accessory,
  children,
}: {
  title: string;
  onPressTitle?: () => void;
  gap?: number;
  /** Rendered between the title and the row — e.g. a season picker. */
  accessory?: ReactNode;
  children: ReactNode;
}) {
  const insets = useInsetStyle();
  return (
    <View style={styles.section}>
      <SectionHeader title={title} onPress={onPressTitle} />
      {accessory ? <View style={[styles.accessory, insets]}>{accessory}</View> : null}
      <FocusGuide autoFocus style={styles.rowGuide}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={[styles.row, insets, { gap }]}
        >
          {children}
        </ScrollView>
      </FocusGuide>
    </View>
  );
}

/** Left/right padding that starts content past the section rail; rows scroll underneath it. */
function useInsetStyle() {
  const { insetLeft, insetRight } = useContentLayout();
  return { paddingLeft: insetLeft, paddingRight: insetRight };
}

/**
 * The row is pulled up under whatever sits above it (see `headerRow`), and its transparent padding
 * would otherwise swallow that content's presses, hover and clicks — keep it on top.
 */
const ABOVE_ROW = { zIndex: 1 } as const;

const styles = StyleSheet.create({
  section: {
    marginTop: space(3),
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "baseline",
    justifyContent: "space-between",
    // The row below adds `focusRoom` of its own top padding.
    marginBottom: space(1.5) - focusRoom,
    ...ABOVE_ROW,
  },
  header: {
    ...theme.type.heading,
    color: theme.colors.text,
  },
  seeAllRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(0.25),
  },
  seeAll: {
    ...theme.type.caption,
    color: theme.colors.muted,
  },
  seeAllFocused: {
    color: theme.colors.text,
    textDecorationLine: "underline",
  },
  accessory: {
    marginTop: focusRoom,
    marginBottom: space(1.5) - focusRoom,
    ...ABOVE_ROW,
  },
  // Vertical padding keeps a focused item's lift and glow inside the ScrollView's clip.
  row: {
    paddingVertical: focusRoom,
  },
  // …and the next section is pulled up over the transparent bottom padding, so the visible gap
  // between rows stays `space(1.5)` however far the glow reaches (it still shows in the overlap).
  rowGuide: {
    marginBottom: space(1.5) - focusRoom,
  },
});
