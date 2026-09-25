//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// Web SecureStore backed by localStorage. NOTE: this is NOT secure — it exists only so the flow
// can be exercised in a browser during development. Never ship it as the production web store.
//

import type { SecureStore } from "@anemone/core";

const PREFIX = "anemone:secure:";

export class SecureStoreAdapter implements SecureStore {
    get(key: string): string | null {
        try {
            return globalThis.localStorage?.getItem(PREFIX + key) ?? null;
        } catch {
            return null;
        }
    }

    set(key: string, value: string): void {
        try {
            globalThis.localStorage?.setItem(PREFIX + key, value);
        } catch {
            /* ignore */
        }
    }

    delete(key: string): void {
        try {
            globalThis.localStorage?.removeItem(PREFIX + key);
        } catch {
            /* ignore */
        }
    }
}
