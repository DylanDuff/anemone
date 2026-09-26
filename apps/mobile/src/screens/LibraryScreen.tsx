//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  displayTitle,
  type LibraryDisplayType,
  type LibraryFilters,
  libraryItemsRequest,
  libraryPageItems,
  useLibraryItems,
  useQueryContext,
  UserKeys,
  useStoredValue,
  useUserViews,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { type BrowseParamList, useOpenItem } from "../navigation/routes";
import { showsPageScrollIndicator, useCardWidths, useContentLayout } from "../ui/contentLayout";
import { Poster } from "../ui/Poster";
import { space, theme } from "../ui/theme";
import { FocusGuide, isTV } from "../ui/tv";
import { FilterPanel } from "./library/FilterPanel";
import { LibraryListRow } from "./library/LibraryListRow";
import { LibraryToolbar } from "./library/LibraryToolbar";

const GRID_GAP = 25;

/**
 * How many posters of about `targetWidth` fit across the inset content area, and the width that
 * fills a row exactly.
 */
function gridLayout(available: number, targetWidth: number): { columns: number; posterWidth: number } {
  const columns = Math.max(2, Math.floor((available + GRID_GAP) / (targetWidth + GRID_GAP)));
  const posterWidth = Math.floor((available - GRID_GAP * (columns - 1)) / columns);
  return { columns, posterWidth };
}

/**
 * A library (user view) as an infinitely-scrolling poster grid or list, with sort and filters
 * persisted per library (Swiftfin `PagingLibraryView`). A top-level section, opened from the
 * section switcher. Resolves the library from the cached user views so it works from a deep link.
 */
export function LibraryScreen({
  route,
  navigation,
}: NativeStackScreenProps<BrowseParamList, "Library">) {
  const { libraryID } = route.params;
  const ctx = useQueryContext();
  const { data: views, isLoading: viewsLoading } = useUserViews();
  const library = views?.find((view) => view.Id === libraryID);
  const filters = useStoredValue(UserKeys.libraryFilters(ctx.userID, libraryID));
  const displayType = useStoredValue(UserKeys.libraryDisplayType(ctx.userID, libraryID));

  useEffect(() => {
    if (library) {
      navigation.setOptions({ title: displayTitle(library) });
    }
  }, [library, navigation]);

  if (viewsLoading || !filters.isLoaded || !displayType.isLoaded) {
    return <CenteredMessage loading />;
  }
  if (!library) {
    return <CenteredMessage text="This library could not be found." />;
  }

  return (
    <LibraryContent
      // Switching library from the rail reuses this screen; start fresh (scroll, filter panel).
      key={libraryID}
      library={library}
      filters={filters.value}
      onChangeFilters={filters.setValue}
      displayType={displayType.value}
      onChangeDisplayType={displayType.setValue}
    />
  );
}

/** Mounted once persisted settings are loaded, so the first page is fetched with them. */
function LibraryContent({
  library,
  filters,
  onChangeFilters,
  displayType,
  onChangeDisplayType,
}: {
  library: BaseItemDto;
  filters: LibraryFilters;
  onChangeFilters: (filters: LibraryFilters) => void;
  displayType: LibraryDisplayType;
  onChangeDisplayType: (displayType: LibraryDisplayType) => void;
}) {
  const ctx = useQueryContext();
  const openItem = useOpenItem();
  const { width, insetLeft, insetRight, insetTop, insetBottom } = useContentLayout();
  const [filtersOpen, setFiltersOpen] = useState(false);
  // On TV, react-native-tvos wraps a list's ScrollView in an unstyled TVFocusGuideView, so
  // `flex: 1` has nothing to fill and the list collapses to ~1pt. Size it explicitly from the
  // wrapper instead.
  const [listHeight, setListHeight] = useState<number>();
  const { data, isLoading, error, hasNextPage, fetchNextPage, isFetchingNextPage } =
    useLibraryItems(libraryItemsRequest(library, filters));

  const items = libraryPageItems(data?.pages);
  const total = data?.pages[0]?.TotalRecordCount;
  const isGrid = displayType === "grid";
  const { columns, posterWidth } = gridLayout(width - insetLeft - insetRight, useCardWidths().poster);

  const header = (
    <View style={styles.header}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{displayTitle(library)}</Text>
        {total != null ? <Text style={styles.count}>{total} items</Text> : null}
      </View>
      <FocusGuide autoFocus>
        <LibraryToolbar
          filters={filters}
          onChangeFilters={onChangeFilters}
          displayType={displayType}
          onChangeDisplayType={onChangeDisplayType}
          filtersOpen={filtersOpen}
          onToggleFilters={() => setFiltersOpen((open) => !open)}
        />
        {filtersOpen && library.Id ? (
          <FilterPanel libraryID={library.Id} filters={filters} onChangeFilters={onChangeFilters} />
        ) : null}
      </FocusGuide>
    </View>
  );

  const footer = isLoading || isFetchingNextPage ? <CenteredMessage loading compact /> : null;

  const empty = isLoading ? null : error ? (
    <CenteredMessage text={String(error)} compact />
  ) : (
    <CenteredMessage text="Nothing matches these filters." compact />
  );

  return (
    <View
      style={styles.screen}
      onLayout={isTV ? (event) => setListHeight(event.nativeEvent.layout.height) : undefined}
    >
      <FlatList
        showsVerticalScrollIndicator={showsPageScrollIndicator}
        // Changing column count requires a fresh list.
        key={isGrid ? `grid-${columns}` : "list"}
        style={isTV && listHeight != null ? { height: listHeight } : styles.list}
        data={items}
        keyExtractor={(item, index) => item.Id ?? String(index)}
        numColumns={isGrid ? columns : 1}
        columnWrapperStyle={isGrid ? styles.gridRow : undefined}
        contentContainerStyle={{
          paddingLeft: insetLeft,
          paddingRight: insetRight,
          paddingTop: insetTop,
          paddingBottom: CONTENT_PADDING_BOTTOM + insetBottom,
        }}
        ListHeaderComponent={header}
        ListFooterComponent={footer}
        ListEmptyComponent={empty}
        // On TV, keep several screens of rows mounted: D-pad focus can only move to items that
        // exist, so a thin render window would strand focus at its edge.
        initialNumToRender={isTV ? (isGrid ? columns : 1) * 6 : 10}
        windowSize={isTV ? 9 : 21}
        removeClippedSubviews={false}
        onEndReachedThreshold={isTV ? 2 : 0.6}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void fetchNextPage();
          }
        }}
        renderItem={({ item }) =>
          isGrid ? (
            <Poster api={ctx.api} item={item} width={posterWidth} onPress={openItem} />
          ) : (
            <LibraryListRow api={ctx.api} item={item} onPress={openItem} />
          )
        }
      />
    </View>
  );
}

function CenteredMessage({
  text,
  loading = false,
  compact = false,
}: {
  text?: string;
  loading?: boolean;
  compact?: boolean;
}) {
  return (
    <View style={[styles.message, compact ? null : styles.fill]}>
      {loading ? <ActivityIndicator color={theme.colors.accent} /> : null}
      {text ? <Text style={styles.messageText}>{text}</Text> : null}
    </View>
  );
}

const CONTENT_PADDING_BOTTOM = space(6);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    flex: 1,
  },
  header: {
    paddingTop: space(3),
    paddingBottom: space(3),
    gap: space(2),
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "baseline",
    gap: space(1.5),
  },
  title: {
    ...theme.type.title,
    color: theme.colors.text,
  },
  count: {
    ...theme.type.callout,
    color: theme.colors.muted,
  },
  gridRow: {
    gap: GRID_GAP,
    marginBottom: space(3),
  },
  fill: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  message: {
    alignItems: "center",
    justifyContent: "center",
    padding: space(4),
    gap: space(1),
  },
  messageText: {
    ...theme.type.callout,
    color: theme.colors.muted,
  },
});
