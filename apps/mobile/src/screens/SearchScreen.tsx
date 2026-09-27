//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { personFromItem, useQueryContext, useSearchResults } from "@anemone/core";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { type BrowseParamList, useOpenItem } from "../navigation/routes";
import { useContentLayout } from "../ui/contentLayout";
import { usePageScrollHandler } from "../ui/pageScroll";
import { ErrorState } from "../ui/ErrorState";
import { dockClearance, KeyboardDock } from "../ui/KeyboardDock";
import { PAGE_PADDING_BOTTOM, PageHeader } from "../ui/PageHeader";
import { PERSON_ROW_GAP, PersonCard } from "../ui/PersonCard";
import { PosterRow } from "../ui/PosterRow";
import { Shelf } from "../ui/Shelf";
import { TextField } from "../ui/TextField";
import { space, theme } from "../ui/theme";
import { isTV } from "../ui/tv";
import { EpisodeShelf } from "./item/EpisodeShelf";

/** Wait this long after the last keystroke before searching. */
const SEARCH_DEBOUNCE_MS = 300;

/**
 * Search across the server (a top-level section, Swiftfin `SearchView`): a shelf per category —
 * Movies, Shows, Episodes, Collections, People — each hidden when it has no matches. The field is
 * docked at the bottom, within thumb reach and riding above the keyboard (`KeyboardDock`); on TV,
 * where the system keyboard takes the whole screen, it sits in the header instead.
 */
export function SearchScreen(_props: NativeStackScreenProps<BrowseParamList, "Search">) {
  const ctx = useQueryContext();
  const openItem = useOpenItem();
  const { insetLeft, insetRight, insetBottom } = useContentLayout();
  const [text, setText] = useState("");
  const [dockHeight, setDockHeight] = useState(0);
  const onPageScroll = usePageScrollHandler();
  const searchTerm = useDebouncedValue(text.trim(), SEARCH_DEBOUNCE_MS);
  const { categories, people, isLoading, isEmpty, error, retry } = useSearchResults(searchTerm);

  const status = !searchTerm
    ? "Find movies, shows, episodes and people."
    : isEmpty
      ? `No results for “${searchTerm}”.`
      : undefined;

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
          paddingBottom: PAGE_PADDING_BOTTOM + insetBottom + (isTV ? 0 : dockClearance(dockHeight)),
        }}
      >
        <View style={{ paddingLeft: insetLeft, paddingRight: insetRight }}>
          <PageHeader title="Search">{isTV ? field : null}</PageHeader>
          {status ? <Text style={styles.status}>{status}</Text> : null}
          {searchTerm && error ? <ErrorState error={error} onRetry={retry} /> : null}
          {searchTerm && isLoading ? (
            <ActivityIndicator style={styles.loader} color={theme.colors.accent} />
          ) : null}
        </View>

        {categories.map(({ scope, items }) =>
          scope.key === "episodes" ? (
            items.length > 0 ? (
              <EpisodeShelf
                key={scope.key}
                api={ctx.api}
                title={scope.title}
                episodes={items}
                isLoading={false}
                onPressEpisode={openItem}
              />
            ) : null
          ) : (
            <PosterRow
              key={scope.key}
              title={scope.title}
              api={ctx.api}
              items={items}
              onPressItem={openItem}
            />
          ),
        )}

        {people.length > 0 ? (
          <Shelf title="People" gap={PERSON_ROW_GAP}>
            {people.map((person, index) => (
              <PersonCard
                key={person.Id ?? index}
                api={ctx.api}
                person={personFromItem(person)}
                onPress={() => openItem(person)}
              />
            ))}
          </Shelf>
        ) : null}
      </ScrollView>
      {isTV ? null : <KeyboardDock onHeight={setDockHeight}>{field}</KeyboardDock>}
    </View>
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
  loader: {
    alignSelf: "flex-start",
    marginBottom: space(3),
  },
});
