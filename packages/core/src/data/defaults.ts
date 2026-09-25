//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { KeyValueStore } from "../container/adapters";
import { readJSON, writeJSON } from "./keyValueCodec";

/**
 * A typed key into the settings store, mirroring Swiftfin's `Defaults.Key`. A `null` suite is the
 * app-wide default suite; a suite string scopes the value (e.g. to a user id).
 */
export interface DefaultsKey<Value> {
    readonly suite: string | null;
    readonly name: string;
    readonly defaultValue: () => Value;
}

export function defaultsKey<Value>(
    name: string,
    def: Value | (() => Value),
    suite: string | null = null,
): DefaultsKey<Value> {
    const defaultValue = typeof def === "function" ? (def as () => Value) : () => def;
    return { name, suite, defaultValue };
}

/**
 * Typed accessor over the key/value store for app/user settings — the `UserDefaults` equivalent.
 * Synchronous, matching Swiftfin's `Defaults[...]` subscript and the underlying MMKV adapter.
 */
export class Defaults {
    constructor(private readonly keyValueStore: KeyValueStore) {}

    get<Value>(key: DefaultsKey<Value>): Value {
        const value = readJSON<Value>(this.keyValueStore, key.suite, key.name);
        return value ?? key.defaultValue();
    }

    set<Value>(key: DefaultsKey<Value>, value: Value): void {
        writeJSON(this.keyValueStore, key.suite, key.name, value);
    }
}
