//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// Native SQLite database via the Drizzle expo-sqlite driver.
// The web build resolves `database.web.ts` instead (no SQLite; core uses defaults-only storage).
//

import { type AnemoneDatabase, initializeSchema } from "@anemone/core";
import * as schema from "@anemone/core/schema";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

/**
 * Open the app's SQLite database with the Drizzle expo-sqlite driver and ensure the schema exists.
 * This is the concrete `AnemoneDatabase` injected into the core container on native platforms.
 */
export async function createDatabase(name = "anemone.db"): Promise<AnemoneDatabase | undefined> {
    const sqlite = openDatabaseSync(name);
    const db = drizzle(sqlite, { schema }) as unknown as AnemoneDatabase;
    await initializeSchema(db);
    return db;
}
