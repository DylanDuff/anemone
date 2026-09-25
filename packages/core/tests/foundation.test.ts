//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { beforeEach, describe, expect, it } from "vitest";
import { AnyDataStore } from "../src/data/anyData";
import { Defaults } from "../src/data/defaults";
import { AppDefaults } from "../src/data/keys/appDefaults";
import { ServerKeys } from "../src/data/keys/serverKeys";
import { UserKeys } from "../src/data/keys/userKeys";
import { StoredValues } from "../src/data/storedValues";
import { signedIn, signedOut } from "../src/models/userSignInState";
import { makeServerState } from "../src/session/serverState";
import { makeUserState } from "../src/session/userState";
import { MemoryKeyValueStore, MemorySecureStore } from "./support/memoryAdapters";
import { makeTestContainer, makeTestDatabase } from "./support/testContainer";

describe("AnyDataStore", () => {
    it("round-trips a value keyed by (ownerID, field, key)", async () => {
        const db = await makeTestDatabase();
        const store = new AnyDataStore(db);

        expect(await store.fetch("owner", "field", "key")).toBeUndefined();

        await store.store({ a: 1, b: "two" }, "owner", "field", "key");
        expect(await store.fetch("owner", "field", "key")).toEqual({ a: 1, b: "two" });
    });

    it("upserts in place rather than duplicating", async () => {
        const db = await makeTestDatabase();
        const store = new AnyDataStore(db);

        await store.store(1, "o", "f", "k");
        await store.store(2, "o", "f", "k");
        expect(await store.fetch<number>("o", "f", "k")).toBe(2);
    });

    it("deletes by owner, by field, and by exact key", async () => {
        const db = await makeTestDatabase();
        const store = new AnyDataStore(db);

        await store.store("a", "o", "f1", "k1");
        await store.store("b", "o", "f1", "k2");
        await store.store("c", "o", "f2", "k1");

        await store.delete("o", "f1", "k1");
        expect(await store.fetch("o", "f1", "k1")).toBeUndefined();
        expect(await store.fetch("o", "f1", "k2")).toBe("b");

        await store.deleteAllForField("o", "f1");
        expect(await store.fetch("o", "f1", "k2")).toBeUndefined();
        expect(await store.fetch("o", "f2", "k1")).toBe("c");

        await store.deleteAllForOwner("o");
        expect(await store.fetch("o", "f2", "k1")).toBeUndefined();
    });
});

describe("StoredValues", () => {
    it("returns the default when unset (sql)", async () => {
        const db = await makeTestDatabase();
        const storedValues = new StoredValues(new AnyDataStore(db), new MemoryKeyValueStore());
        expect(await storedValues.get(ServerKeys.servers())).toEqual([]);
    });

    it("persists and reads a sql-backed value", async () => {
        const db = await makeTestDatabase();
        const storedValues = new StoredValues(new AnyDataStore(db), new MemoryKeyValueStore());

        const server = makeServerState({ id: "s1", name: "Home", currentURL: "http://host" });
        await storedValues.set(ServerKeys.servers(), [server]);

        const read = await storedValues.get(ServerKeys.servers());
        expect(read).toHaveLength(1);
        expect(read[0]?.id).toBe("s1");
    });

    it("persists a defaults-backed value in the owner's suite", async () => {
        const kv = new MemoryKeyValueStore();
        const storedValues = new StoredValues(new AnyDataStore(await makeTestDatabase()), kv);

        const key = ServerKeys.publicInfo("s1"); // storage: defaults, owner: s1
        await storedValues.set(key, { ServerName: "Home", Id: "s1", Version: "10.9.0" });

        expect((await storedValues.get(key)).ServerName).toBe("Home");
        // stored in the "s1" suite under the field name
        expect(kv.getString("s1", "publicInfo")).toContain("Home");
    });

    it("ignores writes and returns default for an empty owner", async () => {
        const db = await makeTestDatabase();
        const storedValues = new StoredValues(new AnyDataStore(db), new MemoryKeyValueStore());
        const key = UserKeys.data(""); // empty ownerID
        await storedValues.set(key, { Name: "nobody" });
        expect(await storedValues.get(key)).toEqual({});
    });
});

describe("Defaults", () => {
    let defaults: Defaults;
    beforeEach(() => {
        defaults = new Defaults(new MemoryKeyValueStore());
    });

    it("defaults to signed out", () => {
        expect(defaults.get(AppDefaults.lastSignedInUserID())).toEqual(signedOut);
    });

    it("round-trips the sign-in state", () => {
        defaults.set(AppDefaults.lastSignedInUserID(), signedIn("u1"));
        expect(defaults.get(AppDefaults.lastSignedInUserID())).toEqual(signedIn("u1"));
    });
});

describe("AnemoneContainer.currentUserSession", () => {
    it("is null when signed out", async () => {
        const container = await makeTestContainer();
        expect(await container.currentUserSession()).toBeNull();
    });

    it("resolves a session for a saved user + server and caches it", async () => {
        const container = await makeTestContainer();

        const server = makeServerState({ id: "s1", name: "Home", currentURL: "http://host:8096" });
        const user = makeUserState({ id: "u1", serverID: "s1", username: "alice" });
        await container.storedValues.set(ServerKeys.servers(), [server]);
        await container.storedValues.set(UserKeys.users(), [user]);
        container.userSecrets.setAccessToken("u1", "token-123");
        await container.setCurrentUser("u1");

        const session = await container.currentUserSession();
        expect(session).not.toBeNull();
        expect(session?.user.username).toBe("alice");
        expect(session?.server.currentURL).toBe("http://host:8096");
        expect(session?.api.accessToken).toBe("token-123");

        // cached: same reference on second resolve
        expect(await container.currentUserSession()).toBe(session);
    });

    it("resets to signed out when the saved user is missing", async () => {
        const container = await makeTestContainer();
        await container.setCurrentUser("ghost");
        expect(await container.currentUserSession()).toBeNull();
        expect(container.defaults.get(AppDefaults.lastSignedInUserID())).toEqual(signedOut);
    });

    it("re-resolves after resetCurrentUserSession", async () => {
        const container = await makeTestContainer();
        expect(await container.currentUserSession()).toBeNull();

        const server = makeServerState({ id: "s1", name: "Home", currentURL: "http://host" });
        const user = makeUserState({ id: "u1", serverID: "s1", username: "bob" });
        await container.storedValues.set(ServerKeys.servers(), [server]);
        await container.storedValues.set(UserKeys.users(), [user]);
        await container.setCurrentUser("u1");

        const session = await container.currentUserSession();
        expect(session?.user.username).toBe("bob");
    });

    it("keeps secure and key/value stores separate per adapter", async () => {
        const secure = new MemorySecureStore();
        const kv = new MemoryKeyValueStore();
        const container = await makeTestContainer({ secureStore: secure, keyValueStore: kv });

        container.userSecrets.setAccessToken("u1", "secret");
        expect(secure.get("u1-accessToken")).toBe("secret");
        expect(kv.getString(null, "u1-accessToken")).toBeNull();
    });
});
