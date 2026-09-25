//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { beforeEach, describe, expect, it, vi } from "vitest";

// Controllable mock responses for the SDK operation factories used by the sign-in VM.
const mock = {
    authResult: { AccessToken: "tok", User: { Id: "u1", Name: "alice" } } as {
        AccessToken?: string | null;
        User?: { Id?: string; Name?: string } | null;
    },
    quickConnectEnabled: true,
    publicUsers: [{ Id: "u1", Name: "alice" }],
    disclaimer: "Be nice." as string | null,
};

vi.mock("../src/jellyfin/api", () => ({
    getAuthenticationApi: () => ({
        authenticateUserByName: async () => ({ data: mock.authResult }),
        authenticateWithQuickConnect: async () => ({ data: mock.authResult }),
        getQuickConnectEnabled: async () => ({ data: mock.quickConnectEnabled }),
    }),
    getUserApi: () => ({
        getPublicUsers: async () => ({ data: mock.publicUsers }),
    }),
    getBrandingApi: () => ({
        getBrandingOptions: async () => ({ data: { LoginDisclaimer: mock.disclaimer } }),
    }),
}));

import { ServerKeys } from "../src/data/keys/serverKeys";
import { UserKeys } from "../src/data/keys/userKeys";
import { makeServerState } from "../src/session/serverState";
import {
    createUserSignInViewModel,
    type SaveUserRequest,
    type UserSignInEvent,
} from "../src/viewmodels/userSignInViewModel";
import { makeTestContainer } from "./support/testContainer";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));
const server = makeServerState({ id: "s1", name: "Home", currentURL: "http://host" });

async function setup() {
    const container = await makeTestContainer();
    await container.storedValues.set(ServerKeys.servers(), [server]);
    const vm = createUserSignInViewModel(container, server);
    const events: UserSignInEvent[] = [];
    vm.events.subscribe((e) => events.push(e));
    return { container, vm, events };
}

describe("createUserSignInViewModel", () => {
    beforeEach(() => {
        mock.authResult = { AccessToken: "tok", User: { Id: "u1", Name: "alice" } };
        mock.disclaimer = "Be nice.";
    });

    it("loads public data as a background state", async () => {
        const { vm } = await setup();
        vm.send({ kind: "getPublicData" });
        expect([...vm.getBackgroundStates()]).toEqual(["gettingPublicData"]);
        await tick();
        expect([...vm.getBackgroundStates()]).toEqual([]);
        expect(vm.getData().isQuickConnectEnabled).toBe(true);
        expect(vm.getData().publicUsers).toHaveLength(1);
        expect(vm.getData().serverDisclaimer).toBe("Be nice.");
    });

    it("emits `connected` for a new user", async () => {
        const { vm, events } = await setup();
        vm.send({ kind: "signIn", username: "alice", password: "pw" });
        expect(vm.getState()).toBe("signingIn");
        await tick();
        expect(vm.getState()).toBe("initial");
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({ kind: "connected" });
    });

    it("emits `existingUser` when the user is already saved", async () => {
        const { container, vm, events } = await setup();
        await container.storedValues.set(UserKeys.users(), [
            { id: "u1", serverID: "s1", username: "alice" },
        ]);
        vm.send({ kind: "signIn", username: "alice", password: "pw" });
        await tick();
        expect(events[0]).toMatchObject({ kind: "existingUser" });
    });

    it("records an error when credentials return no token", async () => {
        mock.authResult = { AccessToken: null, User: null };
        const { vm } = await setup();
        vm.send({ kind: "signIn", username: "x", password: "y" });
        await tick();
        expect(vm.getError()?.message).toContain("Missing user data");
    });

    it("save persists user, token, data, and attaches to the server", async () => {
        const { container, vm, events } = await setup();
        const request: SaveUserRequest = {
            auth: {
                accessToken: "tok",
                user: { Id: "u1", Name: "alice" },
                userID: "u1",
                username: "alice",
            },
            access: { policy: "requirePin", pin: "1234", pinHint: "the usual" },
        };
        vm.send({ kind: "save", request });
        await tick();

        expect(events.at(-1)).toMatchObject({ kind: "saved" });

        const users = await container.storedValues.get(UserKeys.users());
        expect(users).toHaveLength(1);
        expect(users[0]).toMatchObject({ id: "u1", username: "alice" });

        expect(container.userSecrets.accessToken("u1")).toBe("tok");
        expect(container.userSecrets.pin("u1")).toBe("1234");
        expect(await container.storedValues.get(UserKeys.accessPolicy("u1"))).toBe("requirePin");
        expect(await container.storedValues.get(UserKeys.pinHint("u1"))).toBe("the usual");

        const [savedServer] = await container.storedValues.get(ServerKeys.servers());
        expect(savedServer?.userIDs).toContain("u1");
    });

    it("save is idempotent for the server user list", async () => {
        const { container, vm } = await setup();
        const request: SaveUserRequest = {
            auth: { accessToken: "t", user: { Id: "u1" }, userID: "u1", username: "alice" },
            access: { policy: "none" },
        };
        vm.send({ kind: "save", request });
        await tick();
        vm.send({ kind: "save", request });
        await tick();

        const [savedServer] = await container.storedValues.get(ServerKeys.servers());
        expect(savedServer?.userIDs.filter((id: string) => id === "u1")).toHaveLength(1);
        const users = await container.storedValues.get(UserKeys.users());
        expect(users).toHaveLength(1);
    });
});
