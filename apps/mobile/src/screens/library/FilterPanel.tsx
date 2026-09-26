//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  activeFilterCount,
  clearedFilters,
  type LibraryFilters,
  toggleGenre,
  useGenres,
} from "@anemone/core";
import { StyleSheet, Text, View } from "react-native";
import { useGlassButtons } from "../../settings";
import { Chip } from "../../ui/Chip";
import { GlassFill, glassFillHost } from "../../ui/Glass";
import { space, theme } from "../../ui/theme";

/**
 * Played/favorite traits and the library's genres, as toggle chips. The panel is frosted like the
 * toolbar chips (Settings → Glass buttons); its chips stay plain, as glass on glass only hazes.
 */
export function FilterPanel({
  libraryID,
  filters,
  onChangeFilters,
}: {
  libraryID: string;
  filters: LibraryFilters;
  onChangeFilters: (filters: LibraryFilters) => void;
}) {
  const { data: genres } = useGenres(libraryID);
  const genreNames = (genres ?? []).map((genre) => genre.Name).filter(Boolean) as string[];
  const glass = useGlassButtons();

  return (
    <View style={[styles.panel, glass ? glassFillHost : null]}>
      {glass ? <GlassFill radius={theme.radii.lg} /> : null}
      <Text style={styles.label}>Show</Text>
      <View style={styles.chips}>
        <Chip
          icon="eye-off-outline"
          label="Unplayed"
          selected={filters.unplayedOnly}
          onPress={() => onChangeFilters({ ...filters, unplayedOnly: !filters.unplayedOnly })}
        />
        <Chip
          icon="heart"
          label="Favorites"
          selected={filters.favoritesOnly}
          onPress={() => onChangeFilters({ ...filters, favoritesOnly: !filters.favoritesOnly })}
        />
        {activeFilterCount(filters) > 0 ? (
          <Chip label="Clear all" onPress={() => onChangeFilters(clearedFilters(filters))} />
        ) : null}
      </View>

      {genreNames.length > 0 ? (
        <>
          <Text style={styles.label}>Genres</Text>
          <View style={styles.chips}>
            {genreNames.map((genre) => (
              <Chip
                key={genre}
                label={genre}
                selected={filters.genres.includes(genre)}
                onPress={() => onChangeFilters(toggleGenre(filters, genre))}
              />
            ))}
          </View>
        </>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    padding: space(2),
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    gap: space(1.25),
  },
  label: {
    ...theme.type.eyebrow,
    color: theme.colors.muted,
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space(1),
  },
});
