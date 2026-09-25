//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// Native SecureStore backed by expo-secure-store (Keychain / Keystore).
// The web build resolves `secureStore.web.ts` instead (localStorage — dev only).
//

import type { SecureStore } from "@anemone/core";
import * as ExpoSecureStore from "expo-secure-store";

/**
 * `SecureStore` backed by expo-secure-store. Reads/writes use the synchronous APIs; deletion uses
 * the async API fire-and-forget since expo-secure-store has no synchronous delete.
 */
export class SecureStoreAdapter implements SecureStore {
    get(key: string): string | null {
        return ExpoSecureStore.getItem(key);
    }

    set(key: string, value: string): void {
        ExpoSecureStore.setItem(key, value);
    }

    delete(key: string): void {
        void ExpoSecureStore.deleteItemAsync(key);
    }
}
