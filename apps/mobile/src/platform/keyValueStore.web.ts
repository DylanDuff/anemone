//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// Web KeyValueStore backed by localStorage. Suites are namespaced by a key prefix.
//

import type { KeyValueStore } from "@anemone/core";

const DEFAULT_SUITE = "__default__";

function scopedKey(suite: string | null, key: string): string {
    return `anemone:${suite ?? DEFAULT_SUITE}:${key}`;
}

function suitePrefix(suite: string): string {
    return `anemone:${suite}:`;
}

/** `KeyValueStore` backed by `localStorage` for the web build. */
export class KeyValueStoreAdapter implements KeyValueStore {
    getString(suite: string | null, key: string): string | null {
        try {
            return globalThis.localStorage?.getItem(scopedKey(suite, key)) ?? null;
        } catch {
            return null;
        }
    }

    setString(suite: string | null, key: string, value: string): void {
        try {
            globalThis.localStorage?.setItem(scopedKey(suite, key), value);
        } catch {
            /* storage unavailable / quota — ignore */
        }
    }

    delete(suite: string | null, key: string): void {
        try {
            globalThis.localStorage?.removeItem(scopedKey(suite, key));
        } catch {
            /* ignore */
        }
    }

    clearSuite(suite: string): void {
        try {
            const storage = globalThis.localStorage;
            if (!storage) {
                return;
            }
            const prefix = suitePrefix(suite);
            const toRemove: string[] = [];
            for (let index = 0; index < storage.length; index += 1) {
                const key = storage.key(index);
                if (key && key.startsWith(prefix)) {
                    toRemove.push(key);
                }
            }
            for (const key of toRemove) {
                storage.removeItem(key);
            }
        } catch {
            /* ignore */
        }
    }
}
