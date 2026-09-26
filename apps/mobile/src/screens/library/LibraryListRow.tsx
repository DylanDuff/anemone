//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type Api, displayTitle, isFavorite, isPlayed, itemMetadataLabels } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { StyleSheet, Text, View } from "react-native";
import { Focusable } from "../../ui/Focusable";
import { Icon } from "../../ui/Icon";
import { Poster } from "../../ui/Poster";
import { space, theme } from "../../ui/theme";

const THUMB_WIDTH = 64;

/** A compact library row: small poster, title, facts line, and played/favorite marks. */
export function LibraryListRow({
  api,
  item,
  onPress,
}: {
  api: Api;
  item: BaseItemDto;
  onPress: (item: BaseItemDto) => void;
}) {

  return (
    <Focusable
      onPress={() => onPress(item)}
      style={({ pressed, focused }) => [
        styles.row,
        focused ? styles.focused : null,
        pressed ? styles.pressed : null,
      ]}
    >
      <Poster api={api} item={item} width={THUMB_WIDTH} showCaption={false} />
      <View style={styles.text}>
        <Text numberOfLines={1} style={styles.title}>
          {displayTitle(item)}
        </Text>
        <Text numberOfLines={1} style={styles.meta}>
          {itemMetadataLabels(item).join("  ·  ")}
        </Text>
      </View>
      <View style={styles.marks}>
        {isFavorite(item) ? <Icon name="heart" size={16} color={theme.colors.favorite} /> : null}
        {isPlayed(item) ? (
          <Icon name="checkmark-circle" size={16} color={theme.colors.muted} />
        ) : null}
      </View>
    </Focusable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    paddingVertical: space(1),
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: theme.colors.placeholder,
  },
  focused: {
    backgroundColor: theme.colors.surface,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    flex: 1,
    gap: space(0.5),
  },
  title: {
    color: theme.colors.text,
    fontSize: 16,
  },
  meta: {
    color: theme.colors.muted,
    fontSize: 13,
  },
  marks: {
    flexDirection: "row",
    gap: space(1),
  },
});
