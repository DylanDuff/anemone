//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { personFromItem, useQueryContext, useSearchResults } from "@anemone/core";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { useDebouncedValue } from "../hooks/useDebouncedValue";
import { type BrowseParamList, useOpenItem } from "../navigation/routes";
import { showsPageScrollIndicator, useContentLayout } from "../ui/contentLayout";
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
 * Search across the server (a top-level section, Swiftfin `SearchView`): a field, then a shelf per
 * category — Movies, Shows, Episodes, Collections, People — each hidden when it has no matches.
 */
export function SearchScreen({ navigation }: NativeStackScreenProps<BrowseParamList, "Search">) {
  const ctx = useQueryContext();
  const openItem = useOpenItem();
  const { insetLeft, insetRight, insetTop, insetBottom } = useContentLayout();
  const [text, setText] = useState("");
  const searchTerm = useDebouncedValue(text.trim(), SEARCH_DEBOUNCE_MS);
  const { categories, people, isLoading, isEmpty } = useSearchResults(searchTerm);

  useEffect(() => {
    navigation.setOptions({ title: "Search" });
  }, [navigation]);

  const status = !searchTerm
    ? "Find movies, shows, episodes and people."
    : isEmpty
      ? `No results for “${searchTerm}”.`
      : undefined;

  return (
    <ScrollView
      style={styles.screen}
      keyboardShouldPersistTaps="handled"
      showsVerticalScrollIndicator={showsPageScrollIndicator}
      contentContainerStyle={{
        paddingTop: CONTENT_PADDING_TOP + insetTop,
        paddingBottom: CONTENT_PADDING_BOTTOM + insetBottom,
      }}
    >
      <View style={[styles.header, { paddingLeft: insetLeft, paddingRight: insetRight }]}>
        <Text style={styles.title}>Search</Text>
        <TextField
          placeholder="Movies, shows, people…"
          returnKeyType="search"
          autoCapitalize="none"
          autoCorrect={false}
          // On TV, don't open the keyboard until the field is chosen.
          autoFocus={!isTV}
          onChangeText={setText}
          onSubmit={setText}
        />
        {status ? <Text style={styles.status}>{status}</Text> : null}
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
          <PosterRow key={scope.key} title={scope.title} api={ctx.api} items={items} onPressItem={openItem} />
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
  );
}

const CONTENT_PADDING_TOP = space(4);
const CONTENT_PADDING_BOTTOM = space(6);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    gap: space(2),
    maxWidth: 900,
  },
  title: {
    ...theme.type.title,
    color: theme.colors.text,
  },
  status: {
    ...theme.type.callout,
    color: theme.colors.muted,
  },
  loader: {
    alignSelf: "flex-start",
  },
});
