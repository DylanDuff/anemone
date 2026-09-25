//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { PublicSystemInfo } from "@jellyfin/sdk/lib/generated-client/models/public-system-info";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Control what the mocked server returns for getPublicSystemInfo.
let publicInfo: PublicSystemInfo;

vi.mock("../src/jellyfin/api", () => ({
    getSystemApi: () => ({
        getPublicSystemInfo: async () => ({ data: publicInfo }),
    }),
}));

import { ServerKeys } from "../src/data/keys/serverKeys";
import { normalizeServerURL } from "../src/session/serverConnection";
import {
    type ConnectToServerEvent,
    createConnectToServerViewModel,
} from "../src/viewmodels/connectToServerViewModel";
import { makeTestContainer } from "./support/testContainer";

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("normalizeServerURL", () => {
    it("adds a default scheme, trims whitespace and trailing slashes", () => {
        expect(normalizeServerURL("  jelly.example.com/  ")).toBe("http://jelly.example.com");
        expect(normalizeServerURL("https://jelly.example.com")).toBe("https://jelly.example.com");
        expect(normalizeServerURL("http://host:8096/")).toBe("http://host:8096");
    });
});

describe("createConnectToServerViewModel", () => {
    beforeEach(() => {
        publicInfo = { ServerName: "Home Server", Id: "server-1", Version: "10.9.0" };
    });

    it("connects, persists the server + public info, and emits `connected`", async () => {
        const container = await makeTestContainer();
        const vm = createConnectToServerViewModel(container);

        const events: ConnectToServerEvent[] = [];
        vm.events.subscribe((event) => events.push(event));

        vm.send({ kind: "connect", url: "jelly.example.com" });
        expect(vm.getState()).toBe("connecting");

        await tick();

        expect(vm.getState()).toBe("initial");
        expect(events).toHaveLength(1);
        expect(events[0]).toMatchObject({ kind: "connected" });

        const servers = await container.storedValues.get(ServerKeys.servers());
        expect(servers).toHaveLength(1);
        expect(servers[0]).toMatchObject({ id: "server-1", name: "Home Server" });

        const info = await container.storedValues.get(ServerKeys.publicInfo("server-1"));
        expect(info.ServerName).toBe("Home Server");
    });

    it("emits `duplicateServer` without re-saving when the id already exists", async () => {
        const container = await makeTestContainer();
        const vm = createConnectToServerViewModel(container);
        const events: ConnectToServerEvent[] = [];
        vm.events.subscribe((event) => events.push(event));

        vm.send({ kind: "connect", url: "jelly.example.com" });
        await tick();
        vm.send({ kind: "connect", url: "jelly.example.com" });
        await tick();

        expect(events.map((e) => e.kind)).toEqual(["connected", "duplicateServer"]);
        const servers = await container.storedValues.get(ServerKeys.servers());
        expect(servers).toHaveLength(1);
    });

    it("records an error when server identity is missing", async () => {
        publicInfo = { Version: "10.9.0" }; // no ServerName / Id
        const container = await makeTestContainer();
        const vm = createConnectToServerViewModel(container);

        vm.send({ kind: "connect", url: "jelly.example.com" });
        await tick();

        expect(vm.getState()).toBe("initial");
        expect(vm.getError()?.message).toContain("Missing server data");
    });

    it("records an error for an unparseable URL", async () => {
        const container = await makeTestContainer();
        const vm = createConnectToServerViewModel(container);

        vm.send({ kind: "connect", url: "" });
        await tick();

        expect(vm.getError()?.message).toBe("Invalid URL");
    });

    it("addNewURL merges a new URL into the saved server", async () => {
        const container = await makeTestContainer();
        const vm = createConnectToServerViewModel(container);
        vm.send({ kind: "connect", url: "http://host-a" });
        await tick();

        const [saved] = await container.storedValues.get(ServerKeys.servers());
        vm.send({
            kind: "addNewURL",
            server: { ...saved!, currentURL: "http://host-b" },
        });
        await tick();

        const [updated] = await container.storedValues.get(ServerKeys.servers());
        expect(updated?.currentURL).toBe("http://host-b");
        expect(updated?.urls).toContain("http://host-a");
        expect(updated?.urls).toContain("http://host-b");
    });
});
