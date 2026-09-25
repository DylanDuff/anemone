//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { CollectionType } from "@jellyfin/sdk/lib/generated-client/models/collection-type";
import { ItemSortBy } from "@jellyfin/sdk/lib/generated-client/models/item-sort-by";
import { SortOrder } from "@jellyfin/sdk/lib/generated-client/models/sort-order";
import type { ItemsRequest } from "./queries";

/**
 * Whether a library parent should be queried recursively — ported from Swiftfin's
 * `isRecursiveCollection`. User views and untyped folders recurse; TV-show and box-set libraries do
 * not (their direct children — series / sets — are what we want, not the nested episodes).
 */
function isRecursiveCollection(parent: BaseItemDto): boolean {
    const collectionType = parent.CollectionType;
    if (!collectionType || parent.Type === BaseItemKind.UserView) {
        return true;
    }
    return collectionType !== CollectionType.Tvshows && collectionType !== CollectionType.Boxsets;
}

/** The item types to include for a library parent — ported from `supportedItemTypes`. */
function includeItemTypesForParent(parent: BaseItemDto): BaseItemKind[] | undefined {
    switch (parent.CollectionType) {
        case CollectionType.Movies:
            return [BaseItemKind.Movie];
        case CollectionType.Tvshows:
            return [BaseItemKind.Series];
        default:
            // No type filter — let the server return everything in the folder.
            return undefined;
    }
}

/**
 * Build the `getItems` request for browsing a library parent (a user view / collection folder),
 * mirroring Swiftfin's `setParentParameters` + `ItemLibraryViewModel.itemParameters`.
 *
 * This is why a naive `{ parentId }` returns nothing for some servers: user views are virtual and
 * must be queried recursively, and TV/box-set libraries need the opposite. Pass the result to
 * `libraryItemsInfiniteQuery` / `useLibraryItems`.
 */
export function libraryParentRequest(parent: BaseItemDto): ItemsRequest {
    const includeItemTypes = includeItemTypesForParent(parent);
    return {
        parentId: parent.Id ?? undefined,
        recursive: isRecursiveCollection(parent),
        sortBy: [ItemSortBy.SortName],
        sortOrder: [SortOrder.Ascending],
        ...(includeItemTypes ? { includeItemTypes } : {}),
    };
}
