//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type ReactElement, type ReactNode, useState } from "react";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { useContentLayout } from "../../ui/contentLayout";
import { ErrorState } from "../../ui/ErrorState";
import { usePageScrollHandler } from "../../ui/pageScroll";
import { PAGE_PADDING_BOTTOM, PageHeader } from "../../ui/PageHeader";
import { SETTINGS_MAX_WIDTH } from "../../ui/settings/layout";
import { space, theme } from "../../ui/theme";
import { FocusGuide, isTV } from "../../ui/tv";
import { Spinner } from "../../ui/Spinner";

/** The parts of a (possibly paged) TanStack query an admin list needs. */
export interface AdminListQuery<Item> {
  readonly items: readonly Item[] | undefined;
  readonly isLoading: boolean;
  readonly isRefetching: boolean;
  readonly error: unknown;
  readonly refetch: () => unknown;
  readonly hasNextPage?: boolean;
  readonly isFetchingNextPage?: boolean;
  readonly fetchNextPage?: () => unknown;
}

/** An `AdminListQuery` from a TanStack query whose data is the list. */
export function listQuery<Item>(query: {
  data: readonly Item[] | undefined;
  isLoading: boolean;
  isRefetching: boolean;
  error: unknown;
  refetch: () => unknown;
}): AdminListQuery<Item> {
  const { data, isLoading, isRefetching, error, refetch } = query;
  return { items: data, isLoading, isRefetching, error, refetch };
}

/**
 * An admin dashboard list (Sessions, Activity, Devices, Users): the Settings page header, an
 * optional toolbar (filters, actions), then rows — themed on every platform, since the rows carry
 * artwork and progress a native settings list can't. Pages in as it scrolls; pull to refresh
 * where there's touch.
 */
export function AdminListPage<Item>({
  title,
  toolbar,
  query,
  emptyText,
  keyExtractor,
  renderItem,
}: {
  title: string;
  toolbar?: ReactNode;
  query: AdminListQuery<Item>;
  emptyText: string;
  keyExtractor: (item: Item, index: number) => string;
  renderItem: (item: Item) => ReactElement;
}) {
  const { insetLeft, insetRight, insetBottom } = useContentLayout();
  const onPageScroll = usePageScrollHandler();
  // react-native-tvos wraps the list in a focus guide that `flex: 1` can't fill (see CLAUDE.md).
  const [listHeight, setListHeight] = useState<number>();
  const { items, isLoading, isRefetching, error, refetch, hasNextPage, isFetchingNextPage } = query;

  const header = (
    <PageHeader title={title} back>
      {toolbar ? <FocusGuide autoFocus>{toolbar}</FocusGuide> : null}
    </PageHeader>
  );

  const empty = isLoading ? (
    <Spinner style={styles.message} />
  ) : error ? (
    <ErrorState error={error} onRetry={() => void refetch()} />
  ) : (
    <Text style={[styles.message, styles.emptyText]}>{emptyText}</Text>
  );

  return (
    <View
      style={styles.screen}
      onLayout={isTV ? (event) => setListHeight(event.nativeEvent.layout.height) : undefined}
    >
      <FlatList
        showsVerticalScrollIndicator={false}
        onScroll={onPageScroll}
        scrollEventThrottle={16}
        style={isTV && listHeight != null ? { height: listHeight } : styles.list}
        data={items}
        keyExtractor={keyExtractor}
        contentContainerStyle={{
          paddingLeft: insetLeft,
          paddingRight: insetRight,
          paddingBottom: PAGE_PADDING_BOTTOM + insetBottom,
        }}
        ListHeaderComponent={header}
        ItemSeparatorComponent={RowSeparator}
        ListEmptyComponent={empty}
        ListFooterComponent={
          isFetchingNextPage ? (
            <Spinner style={styles.message} />
          ) : null
        }
        refreshControl={
          isTV ? undefined : (
            <RefreshControl
              refreshing={isRefetching && !isLoading}
              onRefresh={() => void refetch()}
              tintColor={theme.colors.muted}
            />
          )
        }
        // On TV keep several screens mounted: D-pad focus can only reach rows that exist.
        initialNumToRender={isTV ? 12 : 10}
        windowSize={isTV ? 9 : 21}
        removeClippedSubviews={false}
        onEndReachedThreshold={isTV ? 2 : 0.6}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) {
            void query.fetchNextPage?.();
          }
        }}
        renderItem={({ item }) => <View style={styles.row}>{renderItem(item)}</View>}
      />
    </View>
  );
}

function RowSeparator() {
  return <View style={styles.separator} />;
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  list: {
    flex: 1,
  },
  // Rows stop at the settings width on large screens; the header spans the page.
  row: {
    maxWidth: SETTINGS_MAX_WIDTH,
  },
  separator: {
    height: space(1),
  },
  message: {
    paddingVertical: space(4),
  },
  emptyText: {
    ...theme.type.callout,
    color: theme.colors.muted,
    textAlign: "center",
  },
});
