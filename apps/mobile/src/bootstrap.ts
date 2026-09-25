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
import { MMKVKeyValueStore } from "./platform/keyValueStore";
import { ExpoSecureStoreAdapter } from "./platform/secureStore";

const DEVICE_ID_KEY = "anemone.deviceId";

/** A stable per-install device id, generated once and persisted in the default settings suite. */
function resolveDeviceID(keyValueStore: MMKVKeyValueStore): string {
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
 * Build the Expo platform adapters and configure the core container. Call once at app startup,
 * then render the app inside `<AnemoneProvider container={...}>`.
 */
export async function configureAnemone(): Promise<AnemoneContainer> {
    const keyValueStore = new MMKVKeyValueStore();
    const secureStore = new ExpoSecureStoreAdapter();
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
        secureStore,
        keyValueStore,
        identity,
        logger: consoleLogger,
    });
}
