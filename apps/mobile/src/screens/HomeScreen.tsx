//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  type Api,
  displayTitle,
  useLatestInLibrary,
  useQueryContext,
  useResumeItems,
  useSessionController,
  useUserViews,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { useOpenItem } from "../navigation/routes";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { ContinueWatchingRow } from "../ui/ContinueWatchingRow";
import { HeroCarousel } from "../ui/HeroCarousel";
import { PosterRow } from "../ui/PosterRow";
import { space, theme } from "../ui/theme";
import { isTV } from "../ui/tv";

/**
 * The signed-in home: a hero carousel of recently-added items across all libraries, followed by a
 * "recently added" poster row per library (Movies, Shows, …). Libraries themselves are opened from
 * the section switcher; tapping a poster, hero slide or resume card opens the item.
 */
export function HomeScreen() {
  const ctx = useQueryContext();
  const sessionController = useSessionController();
  const { data: views, isLoading: viewsLoading } = useUserViews();
  const recent = useLatestInLibrary(undefined, 12);
  const resume = useResumeItems(12);
  const openItem = useOpenItem();

  const loading = viewsLoading || recent.isLoading;

  return (
    <View style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={!isTV}>
        {/*<View style={styles.topBar}>
          <Text style={styles.brand}>Anemone</Text>
          <Pressable onPress={() => void sessionController.signOut()}>
            <Text style={styles.signOut}>Sign out</Text>
          </Pressable>
        </View>*/}

        <HeroCarousel api={ctx.api} items={recent.data ?? []} onPressItem={openItem} />

        <View style={styles.itemRows}>
          <ContinueWatchingRow api={ctx.api} items={resume.data ?? []} onPressItem={openItem} />

          {(views ?? []).map((view) => (
            <LibraryRow
              key={view.Id ?? view.Name ?? Math.random().toString()}
              api={ctx.api}
              view={view}
              onPressItem={openItem}
            />
          ))}

          {loading ? <ActivityIndicator style={styles.loader} color={theme.colors.accent} /> : null}
        </View>

        <View style={styles.footer} />
      </ScrollView>
    </View>
  );
}

/** One "recently added" poster row for a single library. */
function LibraryRow({
  api,
  view,
  onPressItem,
}: {
  api: Api;
  view: BaseItemDto;
  onPressItem: (item: BaseItemDto) => void;
}) {
  const { data } = useLatestInLibrary(view.Id ?? undefined, 20);
  return (
    <PosterRow
      title={displayTitle(view)}
      items={data ?? []}
      api={api}
      onPressItem={onPressItem}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    paddingBottom: space(2),
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: space(2),
    paddingTop: space(2),
    paddingBottom: space(1.5),
  },
  brand: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: "800",
  },
  itemRows: {},
  signOut: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  loader: {
    marginTop: space(3),
  },
  footer: {
    height: space(4),
  },
});
