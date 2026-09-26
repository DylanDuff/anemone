//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { CollectionType } from "@jellyfin/sdk/lib/generated-client/models/collection-type";
import { ItemFilter } from "@jellyfin/sdk/lib/generated-client/models/item-filter";
import { ItemSortBy } from "@jellyfin/sdk/lib/generated-client/models/item-sort-by";
import { describe, expect, it } from "vitest";
import {
    activeFilterCount,
    clearedFilters,
    defaultLibraryFilters,
    libraryItemsRequest,
    SortOrder,
    toggleGenre,
    withSortField,
} from "../src/query/libraryFilters";

const movies: BaseItemDto = {
    Id: "lib-movies",
    Type: BaseItemKind.CollectionFolder,
    CollectionType: CollectionType.Movies,
};

describe("libraryItemsRequest", () => {
    it("defaults to the parent request sorted by name with no filters", () => {
        const request = libraryItemsRequest(movies, defaultLibraryFilters);
        expect(request).toMatchObject({
            parentId: "lib-movies",
            recursive: true,
            includeItemTypes: [BaseItemKind.Movie],
            sortBy: [ItemSortBy.SortName],
            sortOrder: [SortOrder.Ascending],
        });
        expect(request.filters).toBeUndefined();
        expect(request.genres).toBeUndefined();
    });

    it("adds a SortName tiebreaker to non-name sorts", () => {
        const request = libraryItemsRequest(movies, withSortField(defaultLibraryFilters, "rating"));
        expect(request.sortBy).toEqual([ItemSortBy.CommunityRating, ItemSortBy.SortName]);
        expect(request.sortOrder).toEqual([SortOrder.Descending]);
    });

    it("maps trait toggles and genres to query parameters", () => {
        const filters = toggleGenre(
            { ...defaultLibraryFilters, unplayedOnly: true, favoritesOnly: true },
            "Drama",
        );
        const request = libraryItemsRequest(movies, filters);
        expect(request.filters).toEqual([ItemFilter.IsUnplayed, ItemFilter.IsFavorite]);
        expect(request.genres).toEqual(["Drama"]);
    });
});

describe("filter state helpers", () => {
    it("withSortField adopts the field's natural direction", () => {
        expect(withSortField(defaultLibraryFilters, "dateAdded").sortOrder).toBe(SortOrder.Descending);
        expect(withSortField(defaultLibraryFilters, "name").sortOrder).toBe(SortOrder.Ascending);
    });

    it("toggleGenre adds then removes", () => {
        const added = toggleGenre(defaultLibraryFilters, "Comedy");
        expect(added.genres).toEqual(["Comedy"]);
        expect(toggleGenre(added, "Comedy").genres).toEqual([]);
    });

    it("activeFilterCount ignores sort; clearedFilters keeps it", () => {
        const filters = {
            ...withSortField(defaultLibraryFilters, "year"),
            unplayedOnly: true,
            genres: ["A", "B"],
        };
        expect(activeFilterCount(filters)).toBe(3);
        const cleared = clearedFilters(filters);
        expect(activeFilterCount(cleared)).toBe(0);
        expect(cleared.sort).toBe("year");
    });
});
