//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type Api, displayTitle, useItem, useQueryContext, useSimilarItems } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { type RootStackParamList, useAppNavigation, useOpenItem } from "../navigation/routes";
import { BackButton } from "../ui/BackButton";
import { PosterRow } from "../ui/PosterRow";
import { space, theme } from "../ui/theme";
import { useContentLayout } from "../ui/contentLayout";
import { AboutSection } from "./item/AboutSection";
import { CastRow } from "./item/CastRow";
import { CollectionItems } from "./item/CollectionItems";
import { ExtrasSection } from "./item/ExtrasSection";
import { ItemHeader } from "./item/ItemHeader";
import { ItemOverview } from "./item/ItemOverview";
import { PersonDetail } from "./item/PersonDetail";
import { SeasonEpisodes, SeasonsSection } from "./item/SeasonsSection";

/**
 * Item detail for movies, series, seasons, episodes and box sets (Swiftfin `ItemView`). One
 * cinematic layout; the middle section varies by type. People get their own page (`PersonDetail`).
 */
export function ItemScreen({ route }: NativeStackScreenProps<RootStackParamList, "Item">) {
  const { itemID } = route.params;
  const ctx = useQueryContext();
  const navigation = useAppNavigation();
  const openItem = useOpenItem();
  const { data: item, isLoading, error } = useItem(itemID);
  const { insetLeft } = useContentLayout();

  useEffect(() => {
    if (item) {
      navigation.setOptions({ title: displayTitle(item) });
    }
  }, [item, navigation]);

  if (!item?.Id) {
    return (
      <View style={styles.status}>
        <View style={[styles.statusBack, { left: insetLeft }]}>
          <BackButton />
        </View>
        {isLoading ? <ActivityIndicator color={theme.colors.accent} /> : null}
        {error ? <Text style={styles.statusText}>{String(error)}</Text> : null}
        {!isLoading && !error ? <Text style={styles.statusText}>Item not found.</Text> : null}
      </View>
    );
  }

  const identified = item as BaseItemDto & { Id: string };
  const openSeries = (episode: BaseItemDto) => {
    if (episode.SeriesId) {
      openItem({ Id: episode.SeriesId });
    }
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {identified.Type === BaseItemKind.Person ? (
        <PersonDetail api={ctx.api} person={identified} onPressItem={openItem} />
      ) : (
        <>
          <ItemHeader api={ctx.api} item={identified} onOpenSeries={openSeries} />
          <ItemOverview item={identified} />
          <TypeSpecificSection api={ctx.api} item={identified} onPressItem={openItem} />
          <CastRow api={ctx.api} people={identified.People ?? []} />
          <ExtrasSection api={ctx.api} item={identified} onPressItem={openItem} />
          <SimilarItems api={ctx.api} itemID={identified.Id} onPressItem={openItem} />
          <AboutSection item={identified} />
        </>
      )}
    </ScrollView>
  );
}

function TypeSpecificSection({
  api,
  item,
  onPressItem,
}: {
  api: Api;
  item: BaseItemDto & { Id: string };
  onPressItem: (item: BaseItemDto) => void;
}) {
  switch (item.Type) {
    case BaseItemKind.Series:
      return <SeasonsSection api={api} series={item} onPressEpisode={onPressItem} />;
    case BaseItemKind.Season:
      return item.SeriesId ? (
        <SeasonEpisodes
          api={api}
          season={{ ...item, SeriesId: item.SeriesId }}
          onPressEpisode={onPressItem}
        />
      ) : null;
    case BaseItemKind.BoxSet:
      return <CollectionItems api={api} collection={item} onPressItem={onPressItem} />;
    default:
      return null;
  }
}

function SimilarItems({
  api,
  itemID,
  onPressItem,
}: {
  api: Api;
  itemID: string;
  onPressItem: (item: BaseItemDto) => void;
}) {
  const { data: similar = [] } = useSimilarItems(itemID);
  return <PosterRow title="More Like This" api={api} items={similar} onPressItem={onPressItem} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingBottom: space(8),
  },
  status: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: space(1),
    backgroundColor: theme.colors.background,
  },
  statusBack: {
    position: "absolute",
    top: space(3),
  },
  statusText: {
    ...theme.type.callout,
    color: theme.colors.muted,
  },
});
