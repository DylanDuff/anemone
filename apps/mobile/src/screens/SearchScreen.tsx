//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  type Api,
  filterSearchGroups,
  type SearchFilter,
  searchFilters,
  searchItemScopes,
  type SearchItemGroups,
  useQueryContext,
  useRecentSearchItems,
  useSearchResults,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { type BrowseParamList, useOpenItem } from "../navigation/routes";
import { useSearchFieldDocked } from "../settings";
import { useContentLayout, useIsCompact } from "../ui/contentLayout";
import { Chip } from "../ui/Chip";
import { ChoiceMenu } from "../ui/ChoiceMenu";
import type { MenuChoice } from "../ui/choiceMenuTypes";
import { usePageScrollHandler } from "../ui/pageScroll";
import { ErrorState } from "../ui/ErrorState";
import { ItemListRow } from "../ui/ItemListRow";
import { dockClearance, KeyboardDock } from "../ui/KeyboardDock";
import { PAGE_PADDING_BOTTOM, PageHeader } from "../ui/PageHeader";
import { TextField } from "../ui/TextField";
import { space, theme } from "../ui/theme";
import { isTV } from "../ui/tv";
import { Spinner } from "../ui/Spinner";

/** Wait this long after the last keystroke before searching. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Search across the server (a top-level section, Swiftfin `SearchView`): a shelf per category —
 * Movies, Shows, Episodes, Collections, People — each hidden when it has no matches. Before a
 * search, the same rows show what was last opened from results (per user), cleared from the header's
 * "Clear recents". The field is
 * docked at the bottom on phones, within thumb reach and riding above the keyboard
 * (`KeyboardDock`), unless Settings → Navigation → Search field says Top; everywhere else (web,
 * tablets, TV) it sits in the header.
 */
export function SearchScreen(_props: NativeStackScreenProps<BrowseParamList, "Search">) {
  const ctx = useQueryContext();
  const openItem = useOpenItem();
  const recent = useRecentSearchItems();
  // Opening a result also remembers it for "Recently viewed".
  const openResult = (item: BaseItemDto) => {
    recent.record(item);
    openItem(item);
  };
  const { insetLeft, insetRight, insetBottom } = useContentLayout();
  const [text, setText] = useState("");
  const [dockHeight, setDockHeight] = useState(0);
  const [filter, setFilter] = useState<SearchFilter>("all");
  // Phones dock the field at the bottom, in thumb reach above the keyboard (a setting).
  const docked = useSearchFieldDocked();
  const onPageScroll = usePageScrollHandler();
  const searchTerm = useDebouncedValue(text.trim(), SEARCH_DEBOUNCE_MS);
  const { categories, people, isLoading, isEmpty, error, retry } = useSearchResults(
    searchTerm,
    filter,
  );

  const status = searchTerm && isEmpty ? `No results for “${searchTerm}”.` : undefined;

  const field = (
    <TextField
      placeholder="Movies, shows, people…"
      icon="search"
      pill
      glass
      returnKeyType="search"
      autoCapitalize="none"
      autoCorrect={false}
      // On TV, don't open the keyboard until the field is chosen.
      autoFocus={!isTV}
      onChangeText={setText}
      onSubmit={setText}
    />
  );

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.screen}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        // iOS: results stay reachable above the open keyboard.
        automaticallyAdjustKeyboardInsets
        showsVerticalScrollIndicator={false}
        onScroll={onPageScroll}
        scrollEventThrottle={16}
        contentContainerStyle={{
          paddingBottom: PAGE_PADDING_BOTTOM + insetBottom + (docked ? dockClearance(dockHeight) : 0),
        }}
      >
        <View style={{ paddingLeft: insetLeft, paddingRight: insetRight }}>
          <PageHeader
            title="Search"
            // Clear recents (`recent.clear`) is parked for now; the filter takes its place.
            action={<SearchFilterControl value={filter} onChange={setFilter} />}
          >
            {docked ? null : field}
          </PageHeader>
          {status ? <Text style={styles.status}>{status}</Text> : null}
          {searchTerm && error ? <ErrorState error={error} onRetry={retry} /> : null}
          {searchTerm && isLoading ? (
            <Spinner style={styles.loader} />
          ) : null}
          {/* Before a search: what was last opened from results, in the same list. */}
          <SearchList
            api={ctx.api}
            groups={filterSearchGroups(searchTerm ? { categories, people } : recent.groups, filter)}
            onOpen={openResult}
          />
        </View>
      </ScrollView>
      {docked ? <KeyboardDock onHeight={setDockHeight}>{field}</KeyboardDock> : null}
    </View>
  );
}

const FILTER_ICONS: Record<SearchFilter, Pick<MenuChoice<SearchFilter>, "icon" | "systemImage">> = {
  all: { icon: "apps-outline", systemImage: "square.grid.2x2" },
  movies: { icon: "film-outline", systemImage: "film" },
  shows: { icon: "tv-outline", systemImage: "tv" },
  episodes: { icon: "play-outline", systemImage: "play.rectangle" },
  collections: { icon: "albums-outline", systemImage: "rectangle.stack" },
  people: { icon: "people-outline", systemImage: "person.2" },
};

const FILTER_CHOICES: readonly MenuChoice<SearchFilter>[] = searchFilters.map((filter) => ({
  value: filter,
  label:
    filter === "all"
      ? "All"
      : filter === "people"
        ? "People"
        : (searchItemScopes.find((scope) => scope.key === filter)?.title ?? filter),
  ...FILTER_ICONS[filter],
}));

/**
 * Which categories Search shows (results and recents alike). Like the library toolbar: glass
 * chips, or on phones one glass chip opening the platform's menu.
 */
function SearchFilterControl({
  value,
  onChange,
}: {
  value: SearchFilter;
  onChange: (filter: SearchFilter) => void;
}) {
  const compact = useIsCompact();
  if (compact) {
    return (
      <ChoiceMenu
        glass
        choices={FILTER_CHOICES}
        value={value}
        onChange={onChange}
        accessibilityLabel="Show"
      />
    );
  }
  return (
    <View style={styles.filterChips}>
      {FILTER_CHOICES.map((choice) => (
        <Chip
          glass
          key={choice.value}
          label={choice.label}
          selected={choice.value === value}
          onPress={() => onChange(choice.value)}
        />
      ))}
    </View>
  );
}

/**
 * Search's list — a small heading per category (then People), each followed by its rows in the
 * library's list style — for results and recently viewed alike. Empty categories are left out.
 */
function SearchList({
  api,
  groups,
  onOpen,
}: {
  api: Api;
  groups: SearchItemGroups;
  onOpen: (item: BaseItemDto) => void;
}) {
  const sections = [
    ...groups.categories.map(({ scope, items }) => ({ key: scope.key, title: scope.title, items })),
    { key: "people", title: "People", items: groups.people },
  ].filter((section) => section.items.length > 0);

  return (
    <>
      {sections.map((section) => (
        <View key={section.key} style={styles.section}>
          <Text style={styles.sectionTitle}>{section.title}</Text>
          {section.items.map((item, index) => (
            <ItemListRow key={item.Id ?? index} api={api} item={item} onPress={onOpen} />
          ))}
        </View>
      ))}
    </>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // Status, errors and the spinner sit between the header and the result rows.
  status: {
    ...theme.type.callout,
    color: theme.colors.muted,
    marginBottom: space(3),
  },
  filterChips: {
    flexDirection: "row",
    gap: space(1),
  },
  section: {
    marginBottom: space(3),
  },
  sectionTitle: {
    ...theme.type.eyebrow,
    color: theme.colors.muted,
    marginBottom: space(0.5),
  },
  loader: {
    alignSelf: "flex-start",
    marginBottom: space(3),
  },
});
