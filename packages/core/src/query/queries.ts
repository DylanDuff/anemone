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
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { ExtraType } from "@jellyfin/sdk/lib/generated-client/models/extra-type";
import { ItemFields } from "@jellyfin/sdk/lib/generated-client/models/item-fields";
import { MediaType } from "@jellyfin/sdk/lib/generated-client/models/media-type";
import { SortOrder } from "@jellyfin/sdk/lib/generated-client/models/sort-order";
import {
    getGenreApi,
    getLibraryApi,
    getShowApi,
    getUserViewApi,
    getVideoApi,
} from "../jellyfin/api";
import { seriesPlayTarget, uniqueItems } from "../jellyfin/itemHelpers";
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
                // Chapters carry the still frames used to show where playback resumes from.
                fields: [ItemFields.Chapters],
            });
            return uniqueItems(response.data.Items ?? []);
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
            return uniqueItems(response.data.Items ?? []);
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
                // Genres feed the home hero's title block.
                fields: [ItemFields.Genres],
            });
            return uniqueItems(response.data);
        },
    });
}

/**
 * A single item with all fields (overview, people, studios, media sources, chapters…) — Swiftfin
 * `getFullItem`, the base fetch of every item-detail view model.
 */
export function itemQuery(ctx: QueryContext, itemID: string) {
    return queryOptions({
        queryKey: jellyfinKeys.item(ctx.userID, itemID),
        queryFn: async (): Promise<BaseItemDto> => {
            const response = await getLibraryApi(ctx.api).getItem({
                userId: ctx.userID,
                itemId: itemID,
            });
            return response.data;
        },
    });
}

/** "More like this" (Swiftfin `ItemViewModel.getSimilarItems`). */
export function similarItemsQuery(ctx: QueryContext, itemID: string, limit = 20) {
    return queryOptions({
        queryKey: jellyfinKeys.itemRelation(ctx.userID, itemID, "similar"),
        queryFn: async (): Promise<BaseItemDto[]> => {
            const response = await getLibraryApi(ctx.api).getSimilarItems({
                itemId: itemID,
                userId: ctx.userID,
                limit,
            });
            return uniqueItems(response.data.Items ?? []);
        },
    });
}

/** Video extras (featurettes, behind the scenes, …); theme songs excluded, as in Swiftfin. */
export function specialFeaturesQuery(ctx: QueryContext, itemID: string) {
    return queryOptions({
        queryKey: jellyfinKeys.itemRelation(ctx.userID, itemID, "specialFeatures"),
        queryFn: async (): Promise<BaseItemDto[]> => {
            const response = await getLibraryApi(ctx.api).getSpecialFeatures({
                itemId: itemID,
                userId: ctx.userID,
            });
            return response.data.filter((feature) => feature.ExtraType !== ExtraType.ThemeSong);
        },
    });
}

/** Trailers stored alongside the item's media (Swiftfin `getLocalTrailers`). */
export function localTrailersQuery(ctx: QueryContext, itemID: string) {
    return queryOptions({
        queryKey: jellyfinKeys.itemRelation(ctx.userID, itemID, "localTrailers"),
        queryFn: async (): Promise<BaseItemDto[]> => {
            const response = await getLibraryApi(ctx.api).getLocalTrailers({
                itemId: itemID,
                userId: ctx.userID,
            });
            return response.data;
        },
    });
}

/**
 * The other parts of a multi-part item (e.g. "Part 2" of a split film). Only queried when the item
 * reports more than one part — Swiftfin `getAdditionalParts`.
 */
export function additionalPartsQuery(ctx: QueryContext, item: BaseItemDto) {
    const itemID = item.Id ?? "";
    return queryOptions({
        queryKey: jellyfinKeys.itemRelation(ctx.userID, itemID, "additionalParts"),
        queryFn: async (): Promise<BaseItemDto[]> => {
            const response = await getVideoApi(ctx.api).getAdditionalPart({
                itemId: itemID,
                userId: ctx.userID,
            });
            return response.data.Items ?? [];
        },
        enabled: Boolean(item.Id) && (item.PartCount ?? 0) > 1,
    });
}

/**
 * The episode a series' Play button should start: next-up, then in-progress, then first available
 * (Swiftfin `SeriesItemViewModel` — the three fetches run in parallel).
 */
export function seriesPlayTargetQuery(ctx: QueryContext, seriesID: string) {
    return queryOptions({
        queryKey: jellyfinKeys.itemRelation(ctx.userID, seriesID, "seriesPlayTarget"),
        queryFn: async (): Promise<BaseItemDto | null> => {
            const [nextUp, resume, firstAvailable] = await Promise.all([
                getShowApi(ctx.api).getNextUp({ userId: ctx.userID, seriesId: seriesID, limit: 1 }),
                getLibraryApi(ctx.api).getResumeItems({
                    userId: ctx.userID,
                    parentId: seriesID,
                    limit: 1,
                }),
                getLibraryApi(ctx.api).getItems({
                    userId: ctx.userID,
                    parentId: seriesID,
                    includeItemTypes: [BaseItemKind.Episode],
                    recursive: true,
                    sortOrder: [SortOrder.Ascending],
                    limit: 1,
                    enableUserData: true,
                }),
            ]);
            // TanStack Query forbids `undefined` results, hence `null` for "nothing playable".
            return (
                seriesPlayTarget({
                    nextUp: nextUp.data.Items?.[0],
                    resume: resume.data.Items?.[0],
                    firstAvailable: firstAvailable.data.Items?.[0],
                }) ?? null
            );
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
                // Episode cards show a synopsis and use the resume frame.
                fields: [ItemFields.Overview, ItemFields.Chapters],
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
 * The items of a paged library query, in order and de-duplicated: offset paging can repeat an item
 * across a page boundary (sort ties, or the library changing between pages).
 */
export function libraryPageItems(pages: readonly BaseItemDtoQueryResult[] | undefined): BaseItemDto[] {
    return uniqueItems((pages ?? []).flatMap((page) => page.Items ?? []));
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
