//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { Jellyfin } from "@jellyfin/sdk";
import type { Api } from "@jellyfin/sdk/lib/api";
import type { ClientInfo, DeviceInfo } from "@jellyfin/sdk/lib/models";

export type { Api, ClientInfo, DeviceInfo };

/**
 * Identifies this app + device to the Jellyfin server, mirroring the values Swiftfin puts in its
 * `JellyfinClient.Configuration` (client name/version, device name/id). The app supplies these at
 * startup because they are platform-specific (device name, a stable per-install device id).
 */
export interface ClientIdentity {
    readonly clientInfo: ClientInfo;
    readonly deviceInfo: DeviceInfo;
}

/**
 * Wraps the `@jellyfin/sdk` `Jellyfin` object, which is created once from the client/device identity
 * and produces per-server `Api` instances. This is the single place a networking client is built,
 * replacing Swiftfin's `JellyfinClient.Configuration.swiftfinConfiguration(...)`.
 */
export class JellyfinClientFactory {
    private readonly jellyfin: Jellyfin;

    constructor(identity: ClientIdentity) {
        this.jellyfin = new Jellyfin({
            clientInfo: identity.clientInfo,
            deviceInfo: identity.deviceInfo,
        });
    }

    /** Build an `Api` for a server base URL, optionally authenticated with an access token. */
    createApi(basePath: string, accessToken?: string): Api {
        return this.jellyfin.createApi(basePath, accessToken);
    }
}
