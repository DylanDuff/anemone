//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { KeyValueStore } from "../container/adapters";

/** Read and JSON-decode a value from a key/value store, returning `undefined` if absent/corrupt. */
export function readJSON<Value>(
    store: KeyValueStore,
    suite: string | null,
    name: string,
): Value | undefined {
    const raw = store.getString(suite, name);
    if (raw == null) {
        return undefined;
    }
    try {
        return JSON.parse(raw) as Value;
    } catch {
        return undefined;
    }
}

/** JSON-encode and write a value to a key/value store. */
export function writeJSON(
    store: KeyValueStore,
    suite: string | null,
    name: string,
    value: unknown,
): void {
    store.setString(suite, name, JSON.stringify(value ?? null));
}
