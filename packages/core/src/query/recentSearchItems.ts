//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// Search's "Recently viewed": the items (and people) opened from search results, kept per user on
// this device as ids and fetched fresh, so artwork and watched state stay current.
//

import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { useQuery } from "@tanstack/react-query";
import { useCallback } from "react";
import { UserKeys } from "../data/keys/userKeys";
import { useQueryContext } from "../react/context";
import { useStoredValue } from "../react/useStoredValue";
import { itemsByIDsQuery, type SearchItemScope, searchItemScopes } from "./queries";

/** How many recently viewed items Search keeps. */
export const RECENT_SEARCH_LIMIT = 20;

/** `ids` with `id` moved (or added) to the front, capped at `limit`. */
export function withRecentItem(
    ids: readonly string[],
    id: string,
    limit = RECENT_SEARCH_LIMIT,
): string[] {
    return [id, ...ids.filter((existing) => existing !== id)].slice(0, limit);
}

/** Items split into Search's categories (the same rows as its results) plus people. */
export interface SearchItemGroups {
    readonly categories: readonly {
        readonly scope: SearchItemScope;
        readonly items: readonly BaseItemDto[];
    }[];
    readonly people: readonly BaseItemDto[];
}

/**
 * `items` grouped like search results — one entry per `searchItemScopes` category, then people —
 * each keeping the input order. Items of any other type are left out.
 */
export function groupSearchItems(items: readonly BaseItemDto[]): SearchItemGroups {
    return {
        categories: searchItemScopes.map((scope) => ({
            scope,
            items: items.filter((item) =>
                (scope.itemTypes as readonly string[]).includes(item.Type ?? ""),
            ),
        })),
        people: items.filter((item) => item.Type === BaseItemKind.Person),
    };
}

export interface RecentSearchItems {
    /** Most recent first; empty until loaded. */
    readonly items: readonly BaseItemDto[];
    /** `items` grouped into Search's categories, for one row each. */
    readonly groups: SearchItemGroups;
    readonly isLoading: boolean;
    /** Remember an item opened from search results. */
    readonly record: (item: BaseItemDto) => void;
    readonly clear: () => void;
}

/** The signed-in user's recently viewed search results. */
export function useRecentSearchItems(): RecentSearchItems {
    const ctx = useQueryContext();
    const stored = useStoredValue(UserKeys.recentSearchItems(ctx.userID));
    const ids = stored.value;
    const { data, isLoading } = useQuery(itemsByIDsQuery(ctx, ids));
    const { setValue } = stored;

    const record = useCallback(
        (item: BaseItemDto) => {
            if (item.Id) {
                setValue(withRecentItem(ids, item.Id));
            }
        },
        [ids, setValue],
    );
    const clear = useCallback(() => setValue([]), [setValue]);

    const items = ids.length > 0 ? (data ?? []) : [];
    return {
        items,
        groups: groupSearchItems(items),
        isLoading: !stored.isLoaded || (ids.length > 0 && isLoading),
        record,
        clear,
    };
}
