//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

/**
 * A saved server, mirroring Swiftfin's `SwiftfinStore.State.Server`.
 *
 * `urls` is the set of URLs the server has been reached at (stored as a de-duplicated array);
 * `currentURL` is the one in use. `userIDs` lists the saved users belonging to this server.
 * A `ServerState` carries no access token — it can only make public/unauthenticated requests.
 */
export interface ServerState {
    readonly id: string;
    readonly name: string;
    readonly currentURL: string;
    readonly urls: readonly string[];
    readonly userIDs: readonly string[];
}

export function makeServerState(params: {
    id: string;
    name: string;
    currentURL: string;
    urls?: readonly string[];
    userIDs?: readonly string[];
}): ServerState {
    const urls = dedupeUrls(params.urls ?? [params.currentURL]);
    return {
        id: params.id,
        name: params.name,
        currentURL: params.currentURL,
        urls: urls.includes(params.currentURL) ? urls : [...urls, params.currentURL],
        userIDs: params.userIDs ?? [],
    };
}

/** Return a copy with `url` added to the known URL set and made current. */
export function serverStateAddingURL(server: ServerState, url: string): ServerState {
    return {
        ...server,
        currentURL: url,
        urls: dedupeUrls([...server.urls, url]),
    };
}

function dedupeUrls(urls: readonly string[]): string[] {
    return Array.from(new Set(urls));
}
