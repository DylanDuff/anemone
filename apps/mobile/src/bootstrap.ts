//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
    type AnemoneContainer,
    type ClientIdentity,
    configureContainer,
    consoleLogger,
} from "@anemone/core";
import { Platform } from "react-native";
import { createDatabase } from "./platform/database";
import { KeyValueStoreAdapter } from "./platform/keyValueStore";
import { SecureStoreAdapter } from "./platform/secureStore";

const DEVICE_ID_KEY = "anemone.deviceId";

/** A stable per-install device id, generated once and persisted in the default settings suite. */
function resolveDeviceID(keyValueStore: KeyValueStoreAdapter): string {
    const existing = keyValueStore.getString(null, DEVICE_ID_KEY);
    if (existing) {
        return existing;
    }
    const generated =
        globalThis.crypto?.randomUUID?.() ??
        `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
    keyValueStore.setString(null, DEVICE_ID_KEY, generated);
    return generated;
}

/**
 * Build the platform adapters and configure the core container. Call once at app startup, then
 * render inside `<AnemoneProvider container={...}>`.
 *
 * On web there is no SQLite/MMKV/Keychain, so `createDatabase` returns nothing and the container
 * runs in defaults-only storage mode (all values via the key/value store).
 */
export async function configureAnemone(): Promise<AnemoneContainer> {
    const keyValueStore = new KeyValueStoreAdapter();
    const secureStore = new SecureStoreAdapter();
    const database = await createDatabase();

    const identity: ClientIdentity = {
        // TODO(backlog): read version from expo-constants; use a nicer device name.
        clientInfo: { name: "Anemone", version: "0.0.0" },
        deviceInfo: {
            name: `Anemone ${Platform.OS}`,
            id: resolveDeviceID(keyValueStore),
        },
    };

    return configureContainer({
        database,
        storageMode: database ? "auto" : "defaults",
        secureStore,
        keyValueStore,
        identity,
        logger: consoleLogger,
    });
}
