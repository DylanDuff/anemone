//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { AnemoneDatabase } from "../container/adapters";
import { createSchemaStatements } from "./schema";

/**
 * Create the schema on a fresh database if it does not already exist. Idempotent. The app calls
 * this once after opening its `expo-sqlite` database; tests call it after opening `better-sqlite3`.
 *
 * A full drizzle-kit migration pipeline is a backlog item; for a single-table blob store, running
 * the idempotent DDL at startup is sufficient and mirrors Swiftfin adding the store at launch.
 */
export async function initializeSchema(db: AnemoneDatabase): Promise<void> {
    for (const statement of createSchemaStatements) {
        await db.run(statement);
    }
}
