//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// Ready-to-use React data hooks for the UI. Each resolves the current session's `QueryContext` and
// delegates to a query option builder in `queries.ts`. Mount within `<AnemoneProvider>` and a
// TanStack `QueryClientProvider`.
//

import {
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { setItemPlayed } from "../jellyfin/playstate";
import { useQueryContext } from "../react/context";
import {
    episodesQuery,
    genresQuery,
    type ItemsRequest,
    itemQuery,
    latestInLibraryQuery,
    libraryItemsInfiniteQuery,
    nextUpQuery,
    resumeItemsQuery,
    seasonsQuery,
    searchItemsQuery,
    userViewsQuery,
} from "./queries";
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

/**
 * Mark an item played/unplayed, invalidating the resume/next-up/item caches on success so the UI
 * reflects the change (Swiftfin `HomeViewModel.setIsPlayed` + background refresh).
 */
export function useSetItemPlayed() {
    const ctx = useQueryContext();
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ itemID, played }: { itemID: string; played: boolean }) =>
            setItemPlayed(ctx.api, ctx.userID, itemID, played),
        onSuccess: (_result, { itemID }) => {
            void queryClient.invalidateQueries({ queryKey: jellyfinKeys.resumeItems(ctx.userID) });
            void queryClient.invalidateQueries({ queryKey: jellyfinKeys.nextUp(ctx.userID) });
            void queryClient.invalidateQueries({ queryKey: jellyfinKeys.item(ctx.userID, itemID) });
        },
    });
}
