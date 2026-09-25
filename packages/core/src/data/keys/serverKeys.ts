//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { PublicSystemInfo } from "@jellyfin/sdk/lib/generated-client/models/public-system-info";
import type { ServerState } from "../../session/serverState";
import { APP_OWNER_ID, storedKey, type StoredValueKey } from "../storedValues";

/**
 * Server-scoped `StoredValues` keys (Swiftfin `StoredValues.Keys.Server`).
 * The server list is a single app-owned SQL value; public info is cached per server in defaults.
 */
export const ServerKeys = {
    /** All saved servers. */
    servers: (): StoredValueKey<ServerState[]> =>
        storedKey<ServerState[]>({
            field: "servers",
            ownerID: APP_OWNER_ID,
            storage: "sql",
            default: () => [],
        }),

    /** Cached `PublicSystemInfo` for a given server id. */
    publicInfo: (id: string): StoredValueKey<PublicSystemInfo> =>
        storedKey<PublicSystemInfo>({
            field: "publicInfo",
            ownerID: id,
            storage: "defaults",
            default: () => ({}),
        }),
} as const;
