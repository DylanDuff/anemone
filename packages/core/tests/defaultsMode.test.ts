//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { describe, expect, it } from "vitest";
import { AnemoneContainer } from "../src/container/container";
import { ServerKeys } from "../src/data/keys/serverKeys";
import { UserKeys } from "../src/data/keys/userKeys";
import { makeServerState } from "../src/session/serverState";
import { makeUserState } from "../src/session/userState";
import { MemoryKeyValueStore, MemorySecureStore } from "./support/memoryAdapters";
import { testIdentity } from "./support/testContainer";

/** A container with no database — the web/tvOS "defaults-only" mode. */
function makeDefaultsContainer(): AnemoneContainer {
    return new AnemoneContainer({
        secureStore: new MemorySecureStore(),
        keyValueStore: new MemoryKeyValueStore(),
        identity: testIdentity,
        // no `database` → storage is forced to defaults
    });
}

describe("defaults-only storage mode (no SQLite)", () => {
    it("routes sql-defined keys through the key/value store", async () => {
        const container = makeDefaultsContainer();
        expect(container.anyData).toBeUndefined();

        const server = makeServerState({ id: "s1", name: "Home", currentURL: "http://host" });
        await container.storedValues.set(ServerKeys.servers(), [server]);

        const read = await container.storedValues.get(ServerKeys.servers());
        expect(read).toHaveLength(1);
        expect(read[0]?.id).toBe("s1");
    });

    it("resolves a full session without a database", async () => {
        const container = makeDefaultsContainer();
        await container.storedValues.set(ServerKeys.servers(), [
            makeServerState({ id: "s1", name: "Home", currentURL: "http://host" }),
        ]);
        await container.storedValues.set(UserKeys.users(), [
            makeUserState({ id: "u1", serverID: "s1", username: "alice" }),
        ]);
        container.userSecrets.setAccessToken("u1", "tok");
        await container.setCurrentUser("u1");

        const session = await container.currentUserSession();
        expect(session?.user.username).toBe("alice");
        expect(session?.api.accessToken).toBe("tok");
    });
});
