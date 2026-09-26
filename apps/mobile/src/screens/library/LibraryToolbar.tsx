//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  activeFilterCount,
  type LibraryDisplayType,
  type LibraryFilters,
  type LibrarySortField,
  librarySortFields,
  librarySortMeta,
  SortOrder,
  withSortField,
} from "@anemone/core";
import { StyleSheet, View } from "react-native";
import { Chip } from "../../ui/Chip";
import { ChoiceMenu } from "../../ui/ChoiceMenu";
import type { MenuChoice } from "../../ui/choiceMenuTypes";
import { useIsCompact } from "../../ui/contentLayout";
import { space } from "../../ui/theme";

/** Icons for each sort field, for the phone's sort menu. */
const SORT_ICONS: Record<LibrarySortField, Pick<MenuChoice<LibrarySortField>, "icon" | "systemImage">> = {
  name: { icon: "text-outline", systemImage: "textformat" },
  dateAdded: { icon: "calendar-outline", systemImage: "calendar.badge.plus" },
  year: { icon: "time-outline", systemImage: "calendar" },
  rating: { icon: "star-outline", systemImage: "star" },
};

const SORT_CHOICES: readonly MenuChoice<LibrarySortField>[] = librarySortFields.map((field) => ({
  value: field,
  label: librarySortMeta[field].displayTitle,
  ...SORT_ICONS[field],
}));

const DISPLAY_CHOICES: readonly MenuChoice<LibraryDisplayType>[] = [
  { value: "grid", label: "Grid", icon: "grid-outline", systemImage: "square.grid.2x2" },
  { value: "list", label: "List", icon: "list-outline", systemImage: "list.bullet" },
];

/**
 * Sort field + direction on the left; filter panel and grid/list toggles on the right. Phones
 * collapse the sort fields and grid/list each into one chip showing the current choice, with a menu
 * to switch; the direction arrow stays its own chip.
 */
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
  const compact = useIsCompact();

  return (
    <View style={styles.toolbar}>
      <View style={styles.group}>
        {compact ? (
          <ChoiceMenu
            choices={SORT_CHOICES}
            value={filters.sort}
            onChange={(field) => onChangeFilters(withSortField(filters, field))}
            accessibilityLabel="Sort by"
          />
        ) : (
          SORT_CHOICES.map((choice) => (
            <Chip
              key={choice.value}
              label={choice.label}
              selected={filters.sort === choice.value}
              onPress={() => onChangeFilters(withSortField(filters, choice.value))}
            />
          ))
        )}
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
        {compact ? (
          <ChoiceMenu
            choices={DISPLAY_CHOICES}
            value={displayType}
            onChange={onChangeDisplayType}
            accessibilityLabel="Layout"
          />
        ) : (
          DISPLAY_CHOICES.map((choice) => (
            <Chip
              key={choice.value}
              icon={choice.icon}
              label={choice.label}
              selected={displayType === choice.value}
              onPress={() => onChangeDisplayType(choice.value)}
            />
          ))
        )}
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
