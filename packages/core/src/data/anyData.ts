//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { and, eq } from "drizzle-orm";
import type { AnemoneDatabase } from "../container/adapters";
import { anyData } from "./schema";

/**
 * Read/write access to the `any_data` blob table, mirroring Swiftfin's `AnyStoredData` helpers.
 *
 * Values are JSON-encoded on write and decoded on read. All methods are async to accommodate both
 * the synchronous `better-sqlite3` driver and the asynchronous nature of some SQLite drivers; a
 * synchronous driver simply resolves immediately.
 */
export class AnyDataStore {
    constructor(private readonly db: AnemoneDatabase) {}

    /** Fetch and decode the value stored at (ownerID, field, key), or `undefined` if absent. */
    async fetch<Value>(ownerID: string, field: string, key: string): Promise<Value | undefined> {
        const rows = await this.db
            .select({ data: anyData.data })
            .from(anyData)
            .where(
                and(
                    eq(anyData.ownerID, ownerID),
                    eq(anyData.field, field),
                    eq(anyData.key, key),
                ),
            )
            .limit(1);

        const raw = rows[0]?.data;
        if (raw == null) {
            return undefined;
        }

        try {
            return JSON.parse(raw) as Value;
        } catch {
            return undefined;
        }
    }

    /** Encode and upsert `value` at (ownerID, field, key). */
    async store(value: unknown, ownerID: string, field: string, key: string): Promise<void> {
        const encoded = JSON.stringify(value ?? null);

        await this.db
            .insert(anyData)
            .values({ ownerID, field, key, data: encoded })
            .onConflictDoUpdate({
                target: [anyData.ownerID, anyData.field, anyData.key],
                set: { data: encoded },
            });
    }

    /** Delete all rows for an owner. */
    async deleteAllForOwner(ownerID: string): Promise<void> {
        await this.db.delete(anyData).where(eq(anyData.ownerID, ownerID));
    }

    /** Delete all rows for an owner within a single field. */
    async deleteAllForField(ownerID: string, field: string): Promise<void> {
        await this.db
            .delete(anyData)
            .where(and(eq(anyData.ownerID, ownerID), eq(anyData.field, field)));
    }

    /** Delete the single row at (ownerID, field, key). */
    async delete(ownerID: string, field: string, key: string): Promise<void> {
        await this.db
            .delete(anyData)
            .where(
                and(
                    eq(anyData.ownerID, ownerID),
                    eq(anyData.field, field),
                    eq(anyData.key, key),
                ),
            );
    }
}
