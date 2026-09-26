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

    /** Prefix of every latest-in-library query (home hero + rows). */
    allLatestInLibrary: (userID: string) =>
        [...jellyfinKeys.user(userID), "latestInLibrary"] as const,

    latestInLibrary: (userID: string, parentID: string | undefined) =>
        [...jellyfinKeys.allLatestInLibrary(userID), parentID ?? null] as const,

    recentlyAdded: (userID: string, parentID: string | undefined) =>
        [...jellyfinKeys.user(userID), "recentlyAdded", parentID ?? null] as const,

    /** Prefix of every paged library query. */
    allItems: (userID: string) => [...jellyfinKeys.user(userID), "items"] as const,

    items: (userID: string, params: unknown) => [...jellyfinKeys.allItems(userID), params] as const,

    /** Prefix of every single-item query and its relations (similar, extras, …). */
    allItem: (userID: string) => [...jellyfinKeys.user(userID), "item"] as const,

    item: (userID: string, itemID: string) => [...jellyfinKeys.allItem(userID), itemID] as const,

    /** Data related to one item, nested under it so invalidating the item covers it too. */
    itemRelation: (
        userID: string,
        itemID: string,
        relation:
            | "similar"
            | "specialFeatures"
            | "localTrailers"
            | "additionalParts"
            | "seriesPlayTarget"
            | "personItems",
    ) => [...jellyfinKeys.item(userID, itemID), relation] as const,

    seasons: (userID: string, seriesID: string) =>
        [...jellyfinKeys.user(userID), "seasons", seriesID] as const,

    /** Prefix of every episode-list query. */
    allEpisodes: (userID: string) => [...jellyfinKeys.user(userID), "episodes"] as const,

    episodes: (userID: string, seriesID: string, seasonID: string | undefined) =>
        [...jellyfinKeys.allEpisodes(userID), seriesID, seasonID ?? null] as const,

    search: (userID: string, searchTerm: string, params: unknown) =>
        [...jellyfinKeys.user(userID), "search", searchTerm, params] as const,

    genres: (userID: string, parentID: string | undefined) =>
        [...jellyfinKeys.user(userID), "genres", parentID ?? null] as const,
} as const;
