//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { Api } from "../jellyfin/client";
import type { UserSession } from "../session/userSession";

/**
 * The minimal context a data query needs: an authenticated `Api` and the user id to scope requests
 * to. Derived from a `UserSession`, but kept separate so query builders are testable without a full
 * session/container.
 */
export interface QueryContext {
    readonly api: Api;
    readonly userID: string;
}

export function queryContextFromSession(session: UserSession): QueryContext {
    return { api: session.api, userID: session.user.id };
}
