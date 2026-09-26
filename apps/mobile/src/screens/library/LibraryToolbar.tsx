//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  activeFilterCount,
  type LibraryDisplayType,
  type LibraryFilters,
  librarySortFields,
  librarySortMeta,
  SortOrder,
  withSortField,
} from "@anemone/core";
import { StyleSheet, View } from "react-native";
import { Chip } from "../../ui/Chip";
import { space } from "../../ui/theme";

/** Sort field + direction on the left; filter panel and grid/list toggles on the right. */
export function LibraryToolbar({
  filters,
  onChangeFilters,
  displayType,
  onChangeDisplayType,
  filtersOpen,
  onToggleFilters,
}: {
  filters: LibraryFilters;
  onChangeFilters: (filters: LibraryFilters) => void;
  displayType: LibraryDisplayType;
  onChangeDisplayType: (displayType: LibraryDisplayType) => void;
  filtersOpen: boolean;
  onToggleFilters: () => void;
}) {
  const ascending = filters.sortOrder === SortOrder.Ascending;
  const filterCount = activeFilterCount(filters);

  return (
    <View style={styles.toolbar}>
      <View style={styles.group}>
        {librarySortFields.map((field) => (
          <Chip
            key={field}
            label={librarySortMeta[field].displayTitle}
            selected={filters.sort === field}
            onPress={() => onChangeFilters(withSortField(filters, field))}
          />
        ))}
        <Chip
          icon={ascending ? "arrow-up" : "arrow-down"}
          accessibilityLabel={ascending ? "Ascending" : "Descending"}
          onPress={() =>
            onChangeFilters({
              ...filters,
              sortOrder: ascending ? SortOrder.Descending : SortOrder.Ascending,
            })
          }
        />
      </View>

      <View style={styles.group}>
        <Chip
          icon="options-outline"
          label={filterCount > 0 ? `Filters · ${filterCount}` : "Filters"}
          selected={filtersOpen}
          onPress={onToggleFilters}
        />
        <Chip
          icon="grid-outline"
          label="Grid"
          selected={displayType === "grid"}
          onPress={() => onChangeDisplayType("grid")}
        />
        <Chip
          icon="list-outline"
          label="List"
          selected={displayType === "list"}
          onPress={() => onChangeDisplayType("list")}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  toolbar: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    gap: space(1.5),
  },
  group: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space(1),
  },
});
