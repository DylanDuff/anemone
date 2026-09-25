//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { describe, expect, it } from "vitest";
import { ServerKeys } from "../src/data/keys/serverKeys";
import { UserKeys } from "../src/data/keys/userKeys";
import { makeServerState } from "../src/session/serverState";
import { SessionController } from "../src/session/sessionController";
import { makeUserState } from "../src/session/userState";
import { makeTestContainer } from "./support/testContainer";

describe("SessionController", () => {
    it("resolves null when signed out and updates loading", async () => {
        const container = await makeTestContainer();
        const controller = new SessionController(container);

        expect(controller.store.getState().isLoading).toBe(true);
        const session = await controller.refresh();
        expect(session).toBeNull();
        expect(controller.store.getState().isLoading).toBe(false);
        expect(controller.getSession()).toBeNull();
    });

    it("signs a user in and out reactively", async () => {
        const container = await makeTestContainer();
        await container.storedValues.set(ServerKeys.servers(), [
            makeServerState({ id: "s1", name: "Home", currentURL: "http://host" }),
        ]);
        await container.storedValues.set(UserKeys.users(), [
            makeUserState({ id: "u1", serverID: "s1", username: "alice" }),
        ]);
        container.userSecrets.setAccessToken("u1", "tok");

        const controller = new SessionController(container);
        const session = await controller.setCurrentUser("u1");
        expect(session?.user.username).toBe("alice");
        expect(controller.getSession()?.api.accessToken).toBe("tok");

        await controller.signOut();
        expect(controller.getSession()).toBeNull();
    });
});
