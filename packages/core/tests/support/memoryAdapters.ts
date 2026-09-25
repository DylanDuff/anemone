//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { KeyValueStore, SecureStore } from "../../src/container/adapters";

/** In-memory `SecureStore` for tests (the Keychain stand-in). */
export class MemorySecureStore implements SecureStore {
    private readonly store = new Map<string, string>();

    get(key: string): string | null {
        return this.store.get(key) ?? null;
    }

    set(key: string, value: string): void {
        this.store.set(key, value);
    }

    delete(key: string): void {
        this.store.delete(key);
    }
}

/** In-memory, suite-namespaced `KeyValueStore` for tests (the UserDefaults/MMKV stand-in). */
export class MemoryKeyValueStore implements KeyValueStore {
    private readonly suites = new Map<string, Map<string, string>>();

    private suite(name: string | null): Map<string, string> {
        const suiteName = name ?? "__default__";
        let suite = this.suites.get(suiteName);
        if (!suite) {
            suite = new Map();
            this.suites.set(suiteName, suite);
        }
        return suite;
    }

    getString(suite: string | null, key: string): string | null {
        return this.suite(suite).get(key) ?? null;
    }

    setString(suite: string | null, key: string, value: string): void {
        this.suite(suite).set(key, value);
    }

    delete(suite: string | null, key: string): void {
        this.suite(suite).delete(key);
    }

    clearSuite(suite: string): void {
        this.suites.delete(suite);
    }
}
