//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { KeyValueStore } from "@anemone/core";
import { createMMKV, type MMKV } from "react-native-mmkv";

const DEFAULT_SUITE = "__default__";

/**
 * `KeyValueStore` backed by react-native-mmkv. Each suite maps to its own MMKV instance (id), so
 * clearing a user/server suite is isolated. This is the `UserDefaults`/`Defaults` equivalent.
 */
export class MMKVKeyValueStore implements KeyValueStore {
    private readonly instances = new Map<string, MMKV>();

    private instance(suite: string | null): MMKV {
        const id = suite ?? DEFAULT_SUITE;
        let instance = this.instances.get(id);
        if (!instance) {
            instance = createMMKV({ id });
            this.instances.set(id, instance);
        }
        return instance;
    }

    getString(suite: string | null, key: string): string | null {
        return this.instance(suite).getString(key) ?? null;
    }

    setString(suite: string | null, key: string, value: string): void {
        this.instance(suite).set(key, value);
    }

    delete(suite: string | null, key: string): void {
        this.instance(suite).remove(key);
    }

    clearSuite(suite: string): void {
        this.instance(suite).clearAll();
    }
}
