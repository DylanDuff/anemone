//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

/**
 * A saved user, mirroring Swiftfin's `SwiftfinStore.State.User`.
 *
 * The stored record is deliberately minimal — the access token and PIN live in the secure store
 * (keyed `${id}-accessToken` / `${id}-pin`), and the full `UserDto`, access policy and pin hint
 * live in `StoredValues`. See `session/userSecrets.ts` and `data/keys/userKeys.ts`.
 */
export interface UserState {
    readonly id: string;
    readonly serverID: string;
    readonly username: string;
}

export function makeUserState(params: {
    id: string;
    serverID: string;
    username: string;
}): UserState {
    return { id: params.id, serverID: params.serverID, username: params.username };
}
