//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// Web has no SQLite: the container runs in defaults-only storage mode, so no database is created.
// This stub keeps `expo-sqlite` out of the web bundle.
//

import type { AnemoneDatabase } from "@anemone/core";

export async function createDatabase(): Promise<AnemoneDatabase | undefined> {
    return undefined;
}
