//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// TanStack Query option builders for the data-fetching view models (Home, libraries, item detail,
// search). Each is a pure function of a `QueryContext`, so it can be unit-tested by mocking the
// SDK and used from React via `useQuery(...)` / `useInfiniteQuery(...)`.
//

import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import type { BaseItemDtoQueryResult } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto-query-result";
import type { LibraryApiGetItemsRequest } from "@jellyfin/sdk/lib/generated-client/api/library-api";
import { MediaType } from "@jellyfin/sdk/lib/generated-client/models/media-type";
import {
    getGenreApi,
    getLibraryApi,
    getShowApi,
    getUserViewApi,
} from "../jellyfin/api";
import type { QueryContext } from "./queryContext";
import { jellyfinKeys } from "./queryKeys";

/** Parameters for an item query, minus `userId` (which the context supplies). */
export type ItemsRequest = Omit<LibraryApiGetItemsRequest, "userId">;

export const DEFAULT_PAGE_SIZE = 50;

/** The user's libraries/views (Swiftfin `getUserViews`). */
export function userViewsQuery(ctx: QueryContext) {
    return queryOptions({
        queryKey: jellyfinKeys.userViews(ctx.userID),
        queryFn: async (): Promise<BaseItemDto[]> => {
            const response = await getUserViewApi(ctx.api).getUserViews({ userId: ctx.userID });
            return response.data.Items ?? [];
        },
    });
}

/** Continue-watching items (Swiftfin `getResumeItems`). */
export function resumeItemsQuery(ctx: QueryContext, limit = 20) {
    return queryOptions({
        queryKey: jellyfinKeys.resumeItems(ctx.userID),
        queryFn: async (): Promise<BaseItemDto[]> => {
            const response = await getLibraryApi(ctx.api).getResumeItems({
                userId: ctx.userID,
                limit,
                mediaTypes: [MediaType.Video],
                enableUserData: true,
            });
            return response.data.Items ?? [];
        },
    });
}

/** Next-up episodes across the user's shows (Swiftfin `NextUpLibraryViewModel`). */
export function nextUpQuery(ctx: QueryContext, limit = 20) {
    return queryOptions({
        queryKey: jellyfinKeys.nextUp(ctx.userID),
        queryFn: async (): Promise<BaseItemDto[]> => {
            const response = await getShowApi(ctx.api).getNextUp({
                userId: ctx.userID,
                limit,
                enableUserData: true,
            });
            return response.data.Items ?? [];
        },
    });
}

/** Latest media in a library, or across all libraries when `parentID` is undefined. */
export function latestInLibraryQuery(ctx: QueryContext, parentID?: string, limit = 20) {
    return queryOptions({
        queryKey: jellyfinKeys.latestInLibrary(ctx.userID, parentID),
        queryFn: async (): Promise<BaseItemDto[]> => {
            const response = await getLibraryApi(ctx.api).getLatestMedia({
                userId: ctx.userID,
                parentId: parentID,
                limit,
            });
            return response.data;
        },
    });
}

/** A single item, resolved via `getItems` by id (Swiftfin item detail base fetch). */
export function itemQuery(ctx: QueryContext, itemID: string) {
    return queryOptions({
        queryKey: jellyfinKeys.item(ctx.userID, itemID),
        queryFn: async (): Promise<BaseItemDto | undefined> => {
            const response = await getLibraryApi(ctx.api).getItems({
                userId: ctx.userID,
                ids: [itemID],
                enableUserData: true,
            });
            return response.data.Items?.[0];
        },
    });
}

/** Seasons of a series (Swiftfin `SeriesItemViewModel`). */
export function seasonsQuery(ctx: QueryContext, seriesID: string) {
    return queryOptions({
        queryKey: jellyfinKeys.seasons(ctx.userID, seriesID),
        queryFn: async (): Promise<BaseItemDto[]> => {
            const response = await getShowApi(ctx.api).getSeasons({
                seriesId: seriesID,
                userId: ctx.userID,
                enableUserData: true,
            });
            return response.data.Items ?? [];
        },
    });
}

/** Episodes of a series, optionally within a season (Swiftfin `SeasonItemViewModel`). */
export function episodesQuery(ctx: QueryContext, seriesID: string, seasonID?: string) {
    return queryOptions({
        queryKey: jellyfinKeys.episodes(ctx.userID, seriesID, seasonID),
        queryFn: async (): Promise<BaseItemDto[]> => {
            const response = await getShowApi(ctx.api).getEpisodes({
                seriesId: seriesID,
                userId: ctx.userID,
                seasonId: seasonID,
                enableUserData: true,
            });
            return response.data.Items ?? [];
        },
    });
}

/** Genres within a library (Swiftfin home genres). */
export function genresQuery(ctx: QueryContext, parentID?: string) {
    return queryOptions({
        queryKey: jellyfinKeys.genres(ctx.userID, parentID),
        queryFn: async (): Promise<BaseItemDto[]> => {
            const response = await getGenreApi(ctx.api).getGenres({
                userId: ctx.userID,
                parentId: parentID,
            });
            return response.data.Items ?? [];
        },
    });
}

/** Search items by term (Swiftfin `SearchViewModel`). */
export function searchItemsQuery(ctx: QueryContext, searchTerm: string, params: ItemsRequest = {}) {
    return queryOptions({
        queryKey: jellyfinKeys.search(ctx.userID, searchTerm, params),
        queryFn: async (): Promise<BaseItemDto[]> => {
            const response = await getLibraryApi(ctx.api).getItems({
                userId: ctx.userID,
                searchTerm,
                recursive: true,
                enableUserData: true,
                ...params,
            });
            return response.data.Items ?? [];
        },
        enabled: searchTerm.trim().length > 0,
    });
}

/**
 * A paged library, as an infinite query (Swiftfin `PagingLibraryViewModel`). Pages are keyed by
 * index; there is a next page unless the last page returned fewer than `pageSize` items — matching
 * Swiftfin's `hasNextPage = !(pageItems.count < pageSize)` rule.
 */
export function libraryItemsInfiniteQuery(
    ctx: QueryContext,
    params: ItemsRequest = {},
    pageSize = DEFAULT_PAGE_SIZE,
) {
    return infiniteQueryOptions({
        queryKey: jellyfinKeys.items(ctx.userID, { ...params, pageSize }),
        initialPageParam: 0,
        queryFn: async ({ pageParam }): Promise<BaseItemDtoQueryResult> => {
            const response = await getLibraryApi(ctx.api).getItems({
                userId: ctx.userID,
                startIndex: pageParam * pageSize,
                limit: pageSize,
                enableUserData: true,
                ...params,
            });
            return response.data;
        },
        getNextPageParam: (lastPage, allPages) => {
            const count = lastPage.Items?.length ?? 0;
            return count < pageSize ? undefined : allPages.length;
        },
    });
}
