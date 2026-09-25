//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { PublicSystemInfo } from "@jellyfin/sdk/lib/generated-client/models/public-system-info";
import { ErrorMessage } from "../errors/errorMessage";
import { getSystemApi } from "../jellyfin/api";
import type { JellyfinClientFactory } from "../jellyfin/client";
import { makeServerState, type ServerState } from "./serverState";

/** The result of contacting a server: the built state plus its public system info. */
export interface ServerConnectionResult {
    readonly server: ServerState;
    readonly publicInfo: PublicSystemInfo;
}

const OBJECT_REPLACEMENT = "￼";

/**
 * Normalize a user-entered server URL, mirroring Swiftfin's `ConnectToServerViewModel`:
 * trim whitespace and object-replacement characters, strip trailing slashes, and default to
 * `http://` when no scheme is present.
 */
export function normalizeServerURL(input: string): string {
    let url = input.trim();
    // Strip object-replacement characters (from some paste sources).
    url = url.split(OBJECT_REPLACEMENT).join("");
    // Strip trailing slashes.
    url = url.replace(/\/+$/, "");
    if (!url.includes("://")) {
        url = `http://${url}`;
    }
    return url;
}

/**
 * Contact a server's public system info at `url` and build a `ServerState` from it. Does not
 * persist anything — that is the caller's (view model's) responsibility. Throws `ErrorMessage`
 * on an invalid URL, a failed request, or missing server identity.
 */
export async function connectToServer(
    clientFactory: JellyfinClientFactory,
    url: string,
): Promise<ServerConnectionResult> {
    const normalized = normalizeServerURL(url);

    // Validate the URL shape early (matches Swiftfin's `URL(string:)` guard).
    try {
        // eslint-disable-next-line no-new
        new URL(normalized);
    } catch {
        throw new ErrorMessage("Invalid URL");
    }

    const api = clientFactory.createApi(normalized);
    const response = await getSystemApi(api).getPublicSystemInfo();
    const info = response.data;

    const name = info.ServerName;
    const id = info.Id;
    if (!name || !id) {
        throw new ErrorMessage("Missing server data from network call");
    }

    const server = makeServerState({
        id,
        name,
        currentURL: normalized,
        urls: [normalized],
        userIDs: [],
    });

    return { server, publicInfo: info };
}
