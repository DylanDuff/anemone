//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  type Api,
  displayTitle,
  useLatestInLibrary,
  useQueryContext,
  useResumeItems,
  useUserViews,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { useOpenItem } from "../navigation/routes";
import { ActivityIndicator, ScrollView, StyleSheet, View } from "react-native";
import { useContentLayout } from "../ui/contentLayout";
import { usePageScrollHandler } from "../ui/pageScroll";
import { ContinueWatchingRow } from "../ui/ContinueWatchingRow";
import { HeroCarousel } from "../ui/HeroCarousel";
import { PosterRow } from "../ui/PosterRow";
import { space, theme } from "../ui/theme";

/**
 * The signed-in home: a hero carousel of recently-added items across all libraries, followed by a
 * "recently added" poster row per library (Movies, Shows, …). Libraries themselves are opened from
 * the section switcher; tapping a poster, hero slide or resume card opens the item.
 */
export function HomeScreen() {
  const ctx = useQueryContext();
  const { data: views, isLoading: viewsLoading } = useUserViews();
  const recent = useLatestInLibrary(undefined, 12);
  const resume = useResumeItems(12);
  const openItem = useOpenItem();
  const onPageScroll = usePageScrollHandler();

  // The hero bleeds beneath a top pill; only the end of the page needs to clear a bottom one.
  const { insetBottom } = useContentLayout();

  const loading = viewsLoading || recent.isLoading;

  return (
    <View style={styles.screen}>
      <ScrollView
        contentContainerStyle={{ paddingBottom: CONTENT_PADDING_BOTTOM + insetBottom }}
        showsVerticalScrollIndicator={false}
        onScroll={onPageScroll}
        scrollEventThrottle={16}
      >
        <HeroCarousel api={ctx.api} items={recent.data ?? []} onPressItem={openItem} />

        <View>
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

const CONTENT_PADDING_BOTTOM = space(2);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loader: {
    marginTop: space(3),
  },
  footer: {
    height: space(4),
  },
});
