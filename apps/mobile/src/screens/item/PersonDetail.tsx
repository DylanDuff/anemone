//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  type Api,
  displayTitle,
  personFromItem,
  personLifeLabels,
  usePersonItems,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "../../ui/BackButton";
import { useContentLayout, useIsCompact } from "../../ui/contentLayout";
import { PAGE_PADDING_TOP } from "../../ui/PageHeader";
import { PersonPhoto } from "../../ui/PersonCard";
import { PosterRow } from "../../ui/PosterRow";
import { space, theme } from "../../ui/theme";
import { ItemOverview } from "./ItemOverview";

const PHOTO_SIZE = 200;
const COMPACT_PHOTO_SIZE = 140;

/**
 * A person's page (Swiftfin's person library): photo, name, birth/death, biography, then the
 * movies and shows they appear in. Rendered by `ItemScreen` for items of type Person.
 */
export function PersonDetail({
  api,
  person,
  onPressItem,
}: {
  api: Api;
  person: BaseItemDto & { Id: string };
  onPressItem: (item: BaseItemDto) => void;
}) {
  const safeArea = useSafeAreaInsets();
  const { insetLeft, insetRight } = useContentLayout();
  const compact = useIsCompact();
  const { data: items = [], isLoading } = usePersonItems(person.Id);
  const movies = items.filter((item) => item.Type === BaseItemKind.Movie);
  const shows = items.filter((item) => item.Type === BaseItemKind.Series);

  return (
    <>
      <View
        style={[
          styles.header,
          { paddingTop: safeArea.top + PAGE_PADDING_TOP, paddingLeft: insetLeft, paddingRight: insetRight },
        ]}
      >
        <BackButton compact />
        <View style={[styles.identity, compact ? styles.identityStacked : null]}>
          <PersonPhoto
            api={api}
            person={personFromItem(person)}
            size={compact ? COMPACT_PHOTO_SIZE : PHOTO_SIZE}
          />
          <View style={[styles.text, compact ? styles.textStacked : null]}>
            <Text style={styles.name}>{displayTitle(person)}</Text>
            {personLifeLabels(person).map((label) => (
              <Text key={label} style={styles.fact}>
                {label}
              </Text>
            ))}
          </View>
        </View>
      </View>

      <ItemOverview item={person} />

      {isLoading ? <ActivityIndicator style={styles.loader} color={theme.colors.accent} /> : null}
      <PosterRow title="Movies" api={api} items={movies} onPressItem={onPressItem} />
      <PosterRow title="Shows" api={api} items={shows} onPressItem={onPressItem} />
    </>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: space(3),
  },
  identity: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(4),
  },
  identityStacked: {
    flexDirection: "column",
    gap: space(2),
  },
  text: {
    flex: 1,
    gap: space(1),
  },
  textStacked: {
    flex: 0,
    alignItems: "center",
  },
  name: {
    ...theme.type.title,
    color: theme.colors.text,
  },
  fact: {
    ...theme.type.callout,
    color: theme.colors.muted,
  },
  loader: {
    marginTop: space(3),
  },
});
