//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { KeyValueStore } from "../container/adapters";
import type { AnyDataStore } from "./anyData";
import { readJSON, writeJSON } from "./keyValueCodec";

/** Where a stored value physically lives — mirrors Swiftfin's `StorageDestination`. */
export type StorageDestination = "sql" | "defaults";

/**
 * A typed handle to a persisted value, mirroring Swiftfin's `StoredValues.Key<Value>`.
 *
 * - `sql` values live in the `any_data` table addressed by (ownerID, field, name).
 * - `defaults` values live in the key/value store, in a suite named after `ownerID`.
 * - When `name`/`ownerID` are empty (an "always" key) the default is always returned and writes
 *   are ignored — used when there is no current user/server to scope the value to.
 */
export interface StoredValueKey<Value> {
    readonly name: string;
    readonly ownerID: string;
    readonly field: string;
    readonly storage: StorageDestination;
    readonly defaultValue: () => Value;
}

/** The reserved owner id for app-wide values (the list of servers and users). */
export const APP_OWNER_ID = "anemoneApp";

/** Build a key. `field` defaults to `name`; `name` defaults to `field` — one is required. */
export function storedKey<Value>(params: {
    name?: string;
    field: string;
    ownerID: string;
    storage: StorageDestination;
    default: Value | (() => Value);
}): StoredValueKey<Value> {
    const name = params.name ?? params.field;
    const defaultValue =
        typeof params.default === "function"
            ? (params.default as () => Value)
            : () => params.default as Value;

    return {
        name,
        field: params.field,
        ownerID: params.ownerID,
        storage: params.storage,
        defaultValue,
    };
}

/** A key that always returns the given default and never persists (no current owner). */
export function alwaysKey<Value>(value: Value | (() => Value)): StoredValueKey<Value> {
    const defaultValue = typeof value === "function" ? (value as () => Value) : () => value;
    return { name: "", ownerID: "", field: "", storage: "defaults", defaultValue };
}

/** Resolve the flat name used for a `defaults`-backed key (matches Swiftfin's `_defaultKey`). */
function resolvedDefaultsName<Value>(key: StoredValueKey<Value>): string {
    return key.field === key.name ? key.name : `${key.field}-${key.name}`;
}

/**
 * Typed accessor over the two persistence backends, mirroring Swiftfin's `StoredValues` subscript.
 *
 * ```ts
 * const servers = await storedValues.get(ServerKeys.servers());
 * await storedValues.set(ServerKeys.servers(), [...servers, newServer]);
 * ```
 */
export class StoredValues {
    constructor(
        private readonly anyData: AnyDataStore,
        private readonly keyValueStore: KeyValueStore,
    ) {}

    async get<Value>(key: StoredValueKey<Value>): Promise<Value> {
        if (key.name.length === 0 || key.ownerID.length === 0) {
            return key.defaultValue();
        }

        if (key.storage === "defaults") {
            const value = readJSON<Value>(this.keyValueStore, key.ownerID, resolvedDefaultsName(key));
            return value ?? key.defaultValue();
        }

        const value = await this.anyData.fetch<Value>(key.ownerID, key.field, key.name);
        return value ?? key.defaultValue();
    }

    async set<Value>(key: StoredValueKey<Value>, value: Value): Promise<void> {
        if (key.name.length === 0 || key.ownerID.length === 0) {
            return;
        }

        if (key.storage === "defaults") {
            writeJSON(this.keyValueStore, key.ownerID, resolvedDefaultsName(key), value);
            return;
        }

        await this.anyData.store(value, key.ownerID, key.field, key.name);
    }
}
