//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

/**
 * Hierarchical TanStack Query keys, scoped per user so switching users doesn't leak cached data.
 * `["jellyfin", userID, <feature>, ...params]`.
 */
export const jellyfinKeys = {
    all: ["jellyfin"] as const,

    user: (userID: string) => [...jellyfinKeys.all, userID] as const,

    userViews: (userID: string) => [...jellyfinKeys.user(userID), "userViews"] as const,

    resumeItems: (userID: string) => [...jellyfinKeys.user(userID), "resumeItems"] as const,

    nextUp: (userID: string) => [...jellyfinKeys.user(userID), "nextUp"] as const,

    latestInLibrary: (userID: string, parentID: string | undefined) =>
        [...jellyfinKeys.user(userID), "latestInLibrary", parentID ?? null] as const,

    recentlyAdded: (userID: string, parentID: string | undefined) =>
        [...jellyfinKeys.user(userID), "recentlyAdded", parentID ?? null] as const,

    items: (userID: string, params: unknown) =>
        [...jellyfinKeys.user(userID), "items", params] as const,

    item: (userID: string, itemID: string) =>
        [...jellyfinKeys.user(userID), "item", itemID] as const,

    seasons: (userID: string, seriesID: string) =>
        [...jellyfinKeys.user(userID), "seasons", seriesID] as const,

    episodes: (userID: string, seriesID: string, seasonID: string | undefined) =>
        [...jellyfinKeys.user(userID), "episodes", seriesID, seasonID ?? null] as const,

    search: (userID: string, searchTerm: string, params: unknown) =>
        [...jellyfinKeys.user(userID), "search", searchTerm, params] as const,

    genres: (userID: string, parentID: string | undefined) =>
        [...jellyfinKeys.user(userID), "genres", parentID ?? null] as const,
} as const;
