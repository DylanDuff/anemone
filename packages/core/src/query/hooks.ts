//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// Ready-to-use React data hooks for the UI. Each resolves the current session's `QueryContext` and
// delegates to a query option builder in `queries.ts`. Mount within `<AnemoneProvider>` and a
// TanStack `QueryClientProvider`.
//

import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import {
    type QueryClient,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { setItemFavorite, setItemPlayed } from "../jellyfin/playstate";
import { useQueryContext } from "../react/context";
import {
    additionalPartsQuery,
    episodesQuery,
    genresQuery,
    type ItemsRequest,
    itemQuery,
    latestInLibraryQuery,
    libraryItemsInfiniteQuery,
    localTrailersQuery,
    nextUpQuery,
    resumeItemsQuery,
    seasonsQuery,
    searchItemsQuery,
    seriesPlayTargetQuery,
    similarItemsQuery,
    specialFeaturesQuery,
    userViewsQuery,
} from "./queries";
import type { QueryContext } from "./queryContext";
import { jellyfinKeys } from "./queryKeys";

export function useUserViews() {
    return useQuery(userViewsQuery(useQueryContext()));
}

export function useResumeItems(limit?: number) {
    return useQuery(resumeItemsQuery(useQueryContext(), limit));
}

export function useNextUp(limit?: number) {
    return useQuery(nextUpQuery(useQueryContext(), limit));
}

export function useLatestInLibrary(parentID?: string, limit?: number) {
    return useQuery(latestInLibraryQuery(useQueryContext(), parentID, limit));
}

export function useItem(itemID: string) {
    return useQuery(itemQuery(useQueryContext(), itemID));
}

export function useSeasons(seriesID: string) {
    return useQuery(seasonsQuery(useQueryContext(), seriesID));
}

export function useEpisodes(seriesID: string, seasonID?: string) {
    return useQuery(episodesQuery(useQueryContext(), seriesID, seasonID));
}

export function useGenres(parentID?: string) {
    return useQuery(genresQuery(useQueryContext(), parentID));
}

export function useSearch(searchTerm: string, params?: ItemsRequest) {
    return useQuery(searchItemsQuery(useQueryContext(), searchTerm, params));
}

/** A paged library as an infinite query (Swiftfin `PagingLibraryViewModel`). */
export function useLibraryItems(params?: ItemsRequest, pageSize?: number) {
    return useInfiniteQuery(libraryItemsInfiniteQuery(useQueryContext(), params, pageSize));
}

export function useSimilarItems(itemID: string) {
    return useQuery(similarItemsQuery(useQueryContext(), itemID));
}

export function useSpecialFeatures(itemID: string) {
    return useQuery(specialFeaturesQuery(useQueryContext(), itemID));
}

export function useLocalTrailers(itemID: string) {
    return useQuery(localTrailersQuery(useQueryContext(), itemID));
}

export function useAdditionalParts(item: BaseItemDto) {
    return useQuery(additionalPartsQuery(useQueryContext(), item));
}

export function useSeriesPlayTarget(seriesID: string) {
    return useQuery(seriesPlayTargetQuery(useQueryContext(), seriesID));
}

/**
 * Invalidate every cached query that shows per-user item state (played, favorite, progress), so a
 * change made on one screen is reflected on all of them (Swiftfin posts
 * `itemShouldRefreshMetadata`). Only mounted queries refetch; the rest refetch when next shown.
 */
function invalidateUserItemData(queryClient: QueryClient, userID: string): void {
    for (const queryKey of [
        jellyfinKeys.resumeItems(userID),
        jellyfinKeys.nextUp(userID),
        jellyfinKeys.allLatestInLibrary(userID),
        jellyfinKeys.allItem(userID),
        jellyfinKeys.allItems(userID),
        jellyfinKeys.allEpisodes(userID),
    ]) {
        void queryClient.invalidateQueries({ queryKey });
    }
}

type UserItemDataSetter = (
    api: QueryContext["api"],
    userID: string,
    itemID: string,
    enabled: boolean,
) => Promise<void>;

function useUserItemDataMutation(setter: UserItemDataSetter) {
    const ctx = useQueryContext();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ itemID, enabled }: { itemID: string; enabled: boolean }) =>
            setter(ctx.api, ctx.userID, itemID, enabled),
        onSuccess: () => invalidateUserItemData(queryClient, ctx.userID),
    });
}

/** Mark an item played/unplayed (Swiftfin `setIsPlayed`). Call with `{ itemID, enabled }`. */
export function useSetItemPlayed() {
    return useUserItemDataMutation(setItemPlayed);
}

/** Favorite/unfavorite an item (Swiftfin `setIsFavorite`). Call with `{ itemID, enabled }`. */
export function useSetItemFavorite() {
    return useUserItemDataMutation(setItemFavorite);
}
