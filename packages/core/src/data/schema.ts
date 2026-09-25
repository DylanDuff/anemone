//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { sql } from "drizzle-orm";
import { index, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

/**
 * The single "bag of bytes" table, mirroring Swiftfin's `SwiftfinStore.V3.AnyData` (CoreStore).
 *
 * Relationships take the form:
 *
 *     ownerID
 *       └─ field
 *            └─ key(s) → data
 *
 * where `ownerID` is like an object, `field`s are property names, and `key`s are values within a
 * `field`. When `field === key` it behaves like a single-value property; a `field` with many
 * `key`s behaves like a dictionary. `data` is the JSON encoding of the stored value.
 *
 * This lets the app add new persisted "properties" without schema migrations — exactly the
 * property Swiftfin relies on.
 */
export const anyData = sqliteTable(
    "any_data",
    {
        ownerID: text("owner_id").notNull().default(""),
        field: text("field").notNull().default(""),
        key: text("key").notNull().default(""),
        /** JSON-encoded value. Null is treated as "absent". */
        data: text("data"),
    },
    (table) => [
        primaryKey({ columns: [table.ownerID, table.field, table.key] }),
        index("any_data_owner_idx").on(table.ownerID),
        index("any_data_owner_field_idx").on(table.ownerID, table.field),
    ],
);

export type AnyDataRow = typeof anyData.$inferSelect;

/**
 * DDL to create the schema on a fresh database. Kept as a raw statement so the app can run it at
 * startup without the full drizzle-kit migration toolchain (that is a backlog item). Idempotent.
 */
export const createSchemaStatements = [
    sql`CREATE TABLE IF NOT EXISTS any_data (
        owner_id TEXT NOT NULL DEFAULT '',
        field TEXT NOT NULL DEFAULT '',
        key TEXT NOT NULL DEFAULT '',
        data TEXT,
        PRIMARY KEY (owner_id, field, key)
    )`,
    sql`CREATE INDEX IF NOT EXISTS any_data_owner_idx ON any_data (owner_id)`,
    sql`CREATE INDEX IF NOT EXISTS any_data_owner_field_idx ON any_data (owner_id, field)`,
];
