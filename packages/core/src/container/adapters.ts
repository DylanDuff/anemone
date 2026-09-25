//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { BaseSQLiteDatabase } from "drizzle-orm/sqlite-core";
import type * as schema from "../data/schema";

/**
 * Secure, per-key storage for secrets — the Keychain equivalent (Swiftfin `KeychainSwift`).
 * Used for access tokens and PINs. Implementations: `expo-secure-store` (app), in-memory (tests).
 *
 * Kept synchronous to mirror Swiftfin's Keychain accessors and keep session construction simple.
 * The Expo adapter wraps `expo-secure-store`'s sync APIs (`getItem`/`setItem`).
 */
export interface SecureStore {
    get(key: string): string | null;
    set(key: string, value: string): void;
    delete(key: string): void;
}

/**
 * Namespaced key/value storage for settings — the `UserDefaults` equivalent (Swiftfin `Defaults`).
 * `suite` mirrors a `UserDefaults` suite name (app-wide, or per-user). A `null`/absent suite is the
 * default app suite. Implementations: `react-native-mmkv` (app), in-memory (tests).
 *
 * Values are stored as JSON strings; typing happens in the `Defaults`/`StoredValues` layer.
 */
export interface KeyValueStore {
    getString(suite: string | null, key: string): string | null;
    setString(suite: string | null, key: string, value: string): void;
    delete(suite: string | null, key: string): void;
    /** Remove every key within a suite (used when deleting a user/server). */
    clearSuite(suite: string): void;
}

/**
 * A Drizzle database handle over SQLite, typed against our schema but agnostic to the driver.
 * Both the `better-sqlite3` driver (Node tests) and the `expo-sqlite` driver (app) produce a
 * database that extends `BaseSQLiteDatabase`, so core never needs to know which one it got.
 *
 * The result kind is left open (`'sync' | 'async'`) so either driver fits; core awaits query
 * results regardless, which is valid for both a synchronous and an asynchronous driver.
 */
export type AnemoneDatabase = BaseSQLiteDatabase<"sync" | "async", unknown, typeof schema>;
