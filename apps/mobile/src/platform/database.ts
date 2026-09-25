//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type AnemoneDatabase, initializeSchema } from "@anemone/core";
import * as schema from "@anemone/core/schema";
import { drizzle } from "drizzle-orm/expo-sqlite";
import { openDatabaseSync } from "expo-sqlite";

/**
 * Open the app's SQLite database with the Drizzle expo-sqlite driver and ensure the schema exists.
 * This is the concrete `AnemoneDatabase` injected into the core container.
 */
export async function createDatabase(name = "anemone.db"): Promise<AnemoneDatabase> {
    const sqlite = openDatabaseSync(name);
    const db = drizzle(sqlite, { schema }) as unknown as AnemoneDatabase;
    await initializeSchema(db);
    return db;
}
