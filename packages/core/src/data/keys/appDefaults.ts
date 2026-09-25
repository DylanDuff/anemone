//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { LibraryDisplayType, PosterDisplayType } from "../../models/displayTypes";
import { signedOut, type UserSignInState } from "../../models/userSignInState";
import { defaultsKey, type DefaultsKey } from "../defaults";

/**
 * App-wide settings keys (Swiftfin's `Defaults`/`SwiftfinDefaults`). Only the keys needed by the
 * foundation and core view models are defined here; more are ported alongside the settings UI.
 */
export const AppDefaults = {
    /** The last user the app was signed in as; drives current-session resolution. */
    lastSignedInUserID: (): DefaultsKey<UserSignInState> =>
        defaultsKey<UserSignInState>("lastSignedInUserID", signedOut),

    /** Default appearance customization used as fallbacks for per-user library settings. */
    Customization: {
        Library: {
            displayType: (): DefaultsKey<LibraryDisplayType> =>
                defaultsKey<LibraryDisplayType>("Customization.Library.displayType", "grid"),
            listColumnCount: (): DefaultsKey<number> =>
                defaultsKey<number>("Customization.Library.listColumnCount", 1),
            posterType: (): DefaultsKey<PosterDisplayType> =>
                defaultsKey<PosterDisplayType>("Customization.Library.posterType", "portrait"),
        },
    },
} as const;
