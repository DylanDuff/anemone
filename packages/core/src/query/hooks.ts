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
    useQueries,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useCallback } from "react";
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
    personItemsQuery,
    resumeItemsQuery,
    seasonsQuery,
    type SearchItemScope,
    searchItemScopes,
    searchItemsQuery,
    searchPeopleQuery,
    searchScopeRequest,
    seriesPlayTargetQuery,
    serverInfoQuery,
    similarItemsQuery,
    specialFeaturesQuery,
    userViewsQuery,
} from "./queries";
import type { QueryContext } from "./queryContext";
import { jellyfinKeys } from "./queryKeys";

export function useServerInfo() {
    return useQuery(serverInfoQuery(useQueryContext()));
}

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

export function useSearchPeople(searchTerm: string) {
    return useQuery(searchPeopleQuery(useQueryContext(), searchTerm));
}

/** One search category's results. */
export interface SearchCategoryResults {
    readonly scope: SearchItemScope;
    readonly items: readonly BaseItemDto[];
    readonly isLoading: boolean;
}

/**
 * Every search category for `searchTerm` at once (Swiftfin `SearchViewModel`): items per
 * `searchItemScopes` entry, plus people. `isEmpty` is true only once everything has loaded with no
 * results and no failure, so a screen can tell "nothing found" from "still looking" or "failed";
 * `error` is the first failure and `retry` refetches every category.
 */
export function useSearchResults(searchTerm: string) {
    const ctx = useQueryContext();
    const categories = useQueries({
        queries: searchItemScopes.map((scope) =>
            searchItemsQuery(ctx, searchTerm, searchScopeRequest(scope)),
        ),
    });
    const people = useQuery(searchPeopleQuery(ctx, searchTerm));

    const results: SearchCategoryResults[] = searchItemScopes.map((scope, index) => ({
        scope,
        items: categories[index]?.data ?? [],
        isLoading: categories[index]?.isLoading ?? false,
    }));
    const isLoading = people.isLoading || results.some((category) => category.isLoading);
    // The first failure, if any; with one, "nothing found" would be misleading.
    const error = people.error ?? categories.find((category) => category.error)?.error ?? null;
    const isEmpty =
        !isLoading &&
        !error &&
        (people.data ?? []).length === 0 &&
        results.every((category) => category.items.length === 0);
    const retry = () => {
        void people.refetch();
        categories.forEach((category) => void category.refetch());
    };

    return { categories: results, people: people.data ?? [], isLoading, isEmpty, error, retry };
}

export function usePersonItems(personID: string) {
    return useQuery(personItemsQuery(useQueryContext(), personID));
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

/** Refresh per-user item state everywhere, e.g. after playback moved the resume position. */
export function useRefreshUserItemData(): () => void {
    const ctx = useQueryContext();
    const queryClient = useQueryClient();
    return useCallback(
        () => invalidateUserItemData(queryClient, ctx.userID),
        [queryClient, ctx.userID],
    );
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
