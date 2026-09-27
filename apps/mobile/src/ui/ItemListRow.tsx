//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  type Api,
  displayTitle,
  isFavorite,
  isPlayed,
  itemMetadataLabels,
  personFromItem,
  seasonEpisodeLabel,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { StyleSheet, Text, View } from "react-native";
import { Focusable } from "./Focusable";
import { Icon } from "./Icon";
import { PersonPhoto } from "./PersonCard";
import { Poster } from "./Poster";
import { space, theme } from "./theme";

const THUMB_WIDTH = 64;

/**
 * An episode's row shows its show's poster (a 16:9 still cropped to a poster reads badly): the
 * show as a minimal item carrying just what the image URL needs.
 */
function posterItem(item: BaseItemDto): BaseItemDto {
  if (item.Type !== BaseItemKind.Episode || !item.SeriesId) {
    return item;
  }
  return {
    Id: item.SeriesId,
    Name: item.SeriesName,
    Type: BaseItemKind.Series,
    ImageTags: item.SeriesPrimaryImageTag ? { Primary: item.SeriesPrimaryImageTag } : undefined,
  };
}

/** Title and facts: an episode leads with its show, then "S1 E2 · Name"; people have no facts. */
function rowLabels(item: BaseItemDto): { title: string; meta: string } {
  if (item.Type === BaseItemKind.Person) {
    return { title: displayTitle(item), meta: "" };
  }
  if (item.Type === BaseItemKind.Episode && item.SeriesName) {
    return {
      title: item.SeriesName,
      meta: [seasonEpisodeLabel(item), displayTitle(item)].filter(Boolean).join("  ·  "),
    };
  }
  return { title: displayTitle(item), meta: itemMetadataLabels(item).join("  ·  ") };
}

/**
 * A compact list row for any item — a library in list mode, search results: small poster (a
 * person's round photo, an episode's show poster), title, facts line, and played/favourite marks.
 */
export function ItemListRow({
  api,
  item,
  onPress,
}: {
  api: Api;
  item: BaseItemDto;
  onPress: (item: BaseItemDto) => void;
}) {
  const labels = rowLabels(item);
  return (
    <Focusable
      onPress={() => onPress(item)}
      style={({ pressed, focused }) => [
        styles.row,
        focused ? styles.focused : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {item.Type === BaseItemKind.Person ? (
        <PersonPhoto api={api} person={personFromItem(item)} size={THUMB_WIDTH} />
      ) : (
        <Poster api={api} item={posterItem(item)} width={THUMB_WIDTH} showCaption={false} />
      )}
      <View style={styles.text}>
        <Text numberOfLines={1} style={styles.title}>
          {labels.title}
        </Text>
        {labels.meta ? (
          <Text numberOfLines={1} style={styles.meta}>
            {labels.meta}
          </Text>
        ) : null}
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
    ...theme.type.label,
    color: theme.colors.text,
    fontWeight: theme.weight.regular,
  },
  meta: {
    ...theme.type.caption,
    color: theme.colors.muted,
  },
  marks: {
    flexDirection: "row",
    gap: space(1),
  },
});
