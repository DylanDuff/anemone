//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { Api } from "../jellyfin/client";
import type { ServerState } from "./serverState";
import type { UserState } from "./userState";

/**
 * The current signed-in context, mirroring Swiftfin's `UserSession`: a `server`, a `user`, and an
 * authenticated `Api` for talking to that server as that user. View models receive this (rather
 * than reaching for globals) so they are testable in isolation.
 */
export interface UserSession {
    readonly api: Api;
    readonly server: ServerState;
    readonly user: UserState;
}

export function makeUserSession(api: Api, server: ServerState, user: UserState): UserSession {
    return { api, server, user };
}
