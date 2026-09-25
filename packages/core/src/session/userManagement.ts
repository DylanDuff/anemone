//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { AnemoneContainer } from "../container/container";
import { ServerKeys } from "../data/keys/serverKeys";
import { UserKeys } from "../data/keys/userKeys";
import type { ServerState } from "./serverState";
import type { UserState } from "./userState";

/**
 * Delete a saved user and all of its associated data, mirroring Swiftfin's `UserState.delete()`.
 *
 * Removes the user from the users list, deletes its SQL-backed stored values and settings suite,
 * detaches it from its server, and clears its secrets (token + PIN). Unlike Swiftfin (which only
 * cleared the PIN here) the access token is also removed, to avoid leaving a stale secret behind.
 */
export async function deleteUser(container: AnemoneContainer, user: UserState): Promise<void> {
    const users = await container.storedValues.get(UserKeys.users());
    await container.storedValues.set(
        UserKeys.users(),
        users.filter((candidate) => candidate.id !== user.id),
    );

    // Per-user SQL data + settings suite.
    await container.anyData.deleteAllForOwner(user.id);
    container.keyValueStore.clearSuite(user.id);

    // Detach from the server.
    const servers = await container.storedValues.get(ServerKeys.servers());
    const index = servers.findIndex((candidate) => candidate.id === user.serverID);
    if (index >= 0) {
        const server = servers[index]!;
        const next = servers.slice();
        next[index] = {
            ...server,
            userIDs: server.userIDs.filter((id) => id !== user.id),
        };
        await container.storedValues.set(ServerKeys.servers(), next);
    }

    // Secrets.
    container.userSecrets.deletePin(user.id);
    container.userSecrets.deleteAccessToken(user.id);
}

/**
 * Delete a saved server and every user that belonged to it, mirroring Swiftfin's
 * `ServerState.delete()`.
 */
export async function deleteServer(container: AnemoneContainer, server: ServerState): Promise<void> {
    const users = await container.storedValues.get(UserKeys.users());
    for (const user of users.filter((candidate) => candidate.serverID === server.id)) {
        await deleteUser(container, user);
    }

    // Server-owned data + public info.
    await container.anyData.deleteAllForOwner(server.id);
    container.keyValueStore.clearSuite(server.id);

    const servers = await container.storedValues.get(ServerKeys.servers());
    await container.storedValues.set(
        ServerKeys.servers(),
        servers.filter((candidate) => candidate.id !== server.id),
    );
}
