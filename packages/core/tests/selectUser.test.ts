//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { describe, expect, it } from "vitest";
import { AppDefaults } from "../src/data/keys/appDefaults";
import { ServerKeys } from "../src/data/keys/serverKeys";
import { UserKeys } from "../src/data/keys/userKeys";
import { isSignedIn } from "../src/models/userSignInState";
import { makeServerState } from "../src/session/serverState";
import { makeUserState } from "../src/session/userState";
import {
    createSelectUserViewModel,
    type SelectUserEvent,
} from "../src/viewmodels/selectUserViewModel";
import type { AnemoneContainer } from "../src/container/container";
import { makeTestContainer } from "./support/testContainer";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

async function seed(container: AnemoneContainer) {
    const serverA = makeServerState({
        id: "sB",
        name: "Beta",
        currentURL: "http://b",
        userIDs: ["u2"],
    });
    const serverB = makeServerState({
        id: "sA",
        name: "Alpha",
        currentURL: "http://a",
        userIDs: ["u1"],
    });
    await container.storedValues.set(ServerKeys.servers(), [serverA, serverB]);
    await container.storedValues.set(UserKeys.users(), [
        makeUserState({ id: "u1", serverID: "sA", username: "zoe" }),
        makeUserState({ id: "u2", serverID: "sB", username: "amy" }),
    ]);
}

describe("createSelectUserViewModel", () => {
    it("loads servers sorted by name with their users, transitioning to content", async () => {
        const container = await makeTestContainer();
        await seed(container);
        const vm = createSelectUserViewModel(container);

        vm.send({ kind: "getServers" });
        expect(vm.getState()).toBe("loading");
        await tick();
        expect(vm.getState()).toBe("content");

        const { servers } = vm.getData();
        expect(servers.map((s) => s.server.name)).toEqual(["Alpha", "Beta"]);
        expect(servers[0]?.users[0]?.username).toBe("zoe");
    });

    it("deletes a user as a background refresh and prunes it everywhere", async () => {
        const container = await makeTestContainer();
        await seed(container);
        const vm = createSelectUserViewModel(container);
        vm.send({ kind: "getServers" });
        await tick();

        const user = makeUserState({ id: "u1", serverID: "sA", username: "zoe" });
        vm.send({ kind: "deleteUsers", users: [user] });
        expect([...vm.getBackgroundStates()]).toEqual(["refreshing"]);
        await tick();
        expect([...vm.getBackgroundStates()]).toEqual([]);

        const users = await container.storedValues.get(UserKeys.users());
        expect(users.map((u) => u.id)).toEqual(["u2"]);
        const servers = await container.storedValues.get(ServerKeys.servers());
        expect(servers.find((s) => s.id === "sA")?.userIDs).toEqual([]);
    });

    it("signs in a user with no access policy and sets them current", async () => {
        const container = await makeTestContainer();
        await seed(container);
        const vm = createSelectUserViewModel(container);
        const events: SelectUserEvent[] = [];
        vm.events.subscribe((e) => events.push(e));

        const user = makeUserState({ id: "u1", serverID: "sA", username: "zoe" });
        vm.send({ kind: "signIn", user, pin: "" });
        await tick();

        expect(events).toEqual([{ kind: "signedIn", user }]);
        const state = container.defaults.get(AppDefaults.lastSignedInUserID());
        expect(isSignedIn(state) && state.userID).toBe("u1");
    });

    it("rejects an incorrect PIN", async () => {
        const container = await makeTestContainer();
        await seed(container);
        await container.storedValues.set(UserKeys.accessPolicy("u1"), "requirePin");
        container.userSecrets.setPin("u1", "4321");
        const vm = createSelectUserViewModel(container);

        const user = makeUserState({ id: "u1", serverID: "sA", username: "zoe" });
        vm.send({ kind: "signIn", user, pin: "0000" });
        await tick();

        expect(vm.getError()?.message).toContain("Incorrect PIN");
        // not signed in
        const state = container.defaults.get(AppDefaults.lastSignedInUserID());
        expect(isSignedIn(state)).toBe(false);
    });
});
