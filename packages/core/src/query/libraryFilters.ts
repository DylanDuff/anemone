//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// The user-adjustable sort/filter state of a library view — a subset of Swiftfin's
// `ItemFilterCollection` (sort, played/favorite traits, genres). Kept as plain JSON so it can be
// persisted per library via `UserKeys.libraryFilters`.
//

import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { ItemFilter } from "@jellyfin/sdk/lib/generated-client/models/item-filter";
import { ItemSortBy } from "@jellyfin/sdk/lib/generated-client/models/item-sort-by";
import { SortOrder } from "@jellyfin/sdk/lib/generated-client/models/sort-order";
import { libraryParentRequest } from "./libraryParent";
import type { ItemsRequest } from "./queries";

export { SortOrder };

export type LibrarySortField = "name" | "dateAdded" | "year" | "rating";

export const librarySortFields: readonly LibrarySortField[] = ["name", "dateAdded", "year", "rating"];

export const librarySortMeta: Record<
    LibrarySortField,
    { displayTitle: string; sortBy: ItemSortBy; defaultOrder: SortOrder }
> = {
    name: { displayTitle: "Name", sortBy: ItemSortBy.SortName, defaultOrder: SortOrder.Ascending },
    dateAdded: {
        displayTitle: "Date Added",
        sortBy: ItemSortBy.DateCreated,
        defaultOrder: SortOrder.Descending,
    },
    year: { displayTitle: "Year", sortBy: ItemSortBy.ProductionYear, defaultOrder: SortOrder.Descending },
    rating: {
        displayTitle: "Rating",
        sortBy: ItemSortBy.CommunityRating,
        defaultOrder: SortOrder.Descending,
    },
};

export interface LibraryFilters {
    readonly sort: LibrarySortField;
    readonly sortOrder: SortOrder;
    readonly unplayedOnly: boolean;
    readonly favoritesOnly: boolean;
    /** Genre *names* (the `genres` query parameter matches by name). */
    readonly genres: readonly string[];
}

export const defaultLibraryFilters: LibraryFilters = {
    sort: "name",
    sortOrder: SortOrder.Ascending,
    unplayedOnly: false,
    favoritesOnly: false,
    genres: [],
};

/** Switch sort field, adopting that field's natural direction (e.g. newest-first for dates). */
export function withSortField(filters: LibraryFilters, sort: LibrarySortField): LibraryFilters {
    return { ...filters, sort, sortOrder: librarySortMeta[sort].defaultOrder };
}

/** Add the genre if absent, remove it if present. */
export function toggleGenre(filters: LibraryFilters, genre: string): LibraryFilters {
    const genres = filters.genres.includes(genre)
        ? filters.genres.filter((existing) => existing !== genre)
        : [...filters.genres, genre];
    return { ...filters, genres };
}

/** How many narrowing filters are active (sort excluded) — for a badge on the filter button. */
export function activeFilterCount(filters: LibraryFilters): number {
    return Number(filters.unplayedOnly) + Number(filters.favoritesOnly) + filters.genres.length;
}

/** Reset narrowing filters, keeping the chosen sort. */
export function clearedFilters(filters: LibraryFilters): LibraryFilters {
    return { ...defaultLibraryFilters, sort: filters.sort, sortOrder: filters.sortOrder };
}

/**
 * The full `getItems` request for a library parent with the given filters applied. Non-name sorts
 * fall back to `SortName` as a tiebreaker so paging is stable across equal keys.
 */
export function libraryItemsRequest(parent: BaseItemDto, filters: LibraryFilters): ItemsRequest {
    const sortBy = librarySortMeta[filters.sort].sortBy;
    const itemFilters = [
        ...(filters.unplayedOnly ? [ItemFilter.IsUnplayed] : []),
        ...(filters.favoritesOnly ? [ItemFilter.IsFavorite] : []),
    ];

    return {
        ...libraryParentRequest(parent),
        sortBy: sortBy === ItemSortBy.SortName ? [sortBy] : [sortBy, ItemSortBy.SortName],
        sortOrder: [filters.sortOrder],
        ...(itemFilters.length > 0 ? { filters: itemFilters } : {}),
        ...(filters.genres.length > 0 ? { genres: [...filters.genres] } : {}),
    };
}
