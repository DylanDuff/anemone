//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useContentLayout } from "../../ui/contentLayout";
import { Focusable } from "../../ui/Focusable";
import { space, theme } from "../../ui/theme";

const COLLAPSED_LINES = 4;

/** Tagline + synopsis, collapsed to a few lines with a More/Less toggle (Swiftfin `OverviewView`). */
export function ItemOverview({ item }: { item: BaseItemDto }) {
  const [expanded, setExpanded] = useState(false);
  const { insetLeft, insetRight } = useContentLayout();
  const tagline = item.Taglines?.[0];
  if (!tagline && !item.Overview) {
    return null;
  }

  return (
    <View style={[styles.container, { paddingLeft: insetLeft, paddingRight: insetRight }]}>
      {tagline ? <Text style={styles.tagline}>{tagline}</Text> : null}
      {item.Overview ? (
        <Focusable onPress={() => setExpanded((value) => !value)}>
          {({ focused }) => (
            <>
              <Text numberOfLines={expanded ? undefined : COLLAPSED_LINES} style={styles.overview}>
                {item.Overview}
              </Text>
              <Text style={[styles.toggle, focused ? styles.toggleFocused : null]}>
                {expanded ? "Less" : "More"}
              </Text>
            </>
          )}
        </Focusable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: space(3),
    maxWidth: 900,
    gap: space(1),
  },
  tagline: {
    ...theme.type.headline,
    color: theme.colors.text,
  },
  overview: {
    ...theme.type.body,
    color: theme.colors.text,
    opacity: 0.85,
  },
  toggle: {
    ...theme.type.caption,
    color: theme.colors.muted,
    marginTop: space(0.5),
    fontWeight: theme.weight.semibold,
  },
  toggleFocused: {
    color: theme.colors.text,
    textDecorationLine: "underline",
  },
});
