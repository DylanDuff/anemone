//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { describe, expect, it } from "vitest";
import { AnemoneContainer } from "../src/container/container";
import { AppSettingsKeys } from "../src/data/keys/appSettingsKeys";
import { MemoryKeyValueStore, MemorySecureStore } from "./support/memoryAdapters";
import { makeTestContainer, testIdentity } from "./support/testContainer";

describe("AppSettingsKeys", () => {
    it("fall back to the caller's platform default until set", async () => {
        const container = await makeTestContainer();
        expect(await container.storedValues.get(AppSettingsKeys.heroGlow(true))).toBe(true);
        expect(await container.storedValues.get(AppSettingsKeys.glassBlur(false))).toBe(false);
        expect(await container.storedValues.get(AppSettingsKeys.glassButtons(false))).toBe(false);
        expect(await container.storedValues.get(AppSettingsKeys.focusIndicator("glow"))).toBe("glow");
        expect(await container.storedValues.get(AppSettingsKeys.navigationPlacement("left"))).toBe("left");
        expect(await container.storedValues.get(AppSettingsKeys.navigationLabels(true))).toBe(true);
    });

    it("round-trip a chosen navigation placement", async () => {
        const container = await makeTestContainer();
        await container.storedValues.set(AppSettingsKeys.navigationPlacement("left"), "top");
        expect(await container.storedValues.get(AppSettingsKeys.navigationPlacement("left"))).toBe("top");
    });

    it("persist in the key/value store, even when SQL storage is available", async () => {
        const keyValueStore = new MemoryKeyValueStore();
        const container = await makeTestContainer({ keyValueStore });
        await container.storedValues.set(AppSettingsKeys.glassBlur(true), false);

        // A fresh container over the same key/value store (and no database) still sees it.
        const reopened = new AnemoneContainer({
            secureStore: new MemorySecureStore(),
            keyValueStore,
            identity: testIdentity,
        });
        expect(await reopened.storedValues.get(AppSettingsKeys.glassBlur(true))).toBe(false);
    });
});
