//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import type { AnemoneDatabase } from "../../src/container/adapters";
import { AnemoneContainer, type ContainerConfig } from "../../src/container/container";
import { initializeSchema } from "../../src/data/database";
import * as schema from "../../src/data/schema";
import type { ClientIdentity } from "../../src/jellyfin/client";
import { MemoryKeyValueStore, MemorySecureStore } from "./memoryAdapters";

export const testIdentity: ClientIdentity = {
    clientInfo: { name: "AnemoneTest", version: "0.0.0" },
    deviceInfo: { name: "test-device", id: "test-device-id" },
};

/** Open a fresh in-memory SQLite database with the schema applied. */
export async function makeTestDatabase(): Promise<AnemoneDatabase> {
    const sqlite = new Database(":memory:");
    const db = drizzle(sqlite, { schema }) as unknown as AnemoneDatabase;
    await initializeSchema(db);
    return db;
}

/** Build a fully-wired container backed by in-memory adapters, for use in tests. */
export async function makeTestContainer(
    overrides: Partial<ContainerConfig> = {},
): Promise<AnemoneContainer> {
    const database = overrides.database ?? (await makeTestDatabase());
    return new AnemoneContainer({
        database,
        secureStore: overrides.secureStore ?? new MemorySecureStore(),
        keyValueStore: overrides.keyValueStore ?? new MemoryKeyValueStore(),
        identity: overrides.identity ?? testIdentity,
        logger: overrides.logger,
    });
}
