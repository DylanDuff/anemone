//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { UserDto } from "@jellyfin/sdk/lib/generated-client/models/user-dto";
import type { LibraryDisplayType } from "../../models/displayTypes";
import type { LocalUserAccessPolicy } from "../../models/localUserAccessPolicy";
import { defaultLibraryFilters, type LibraryFilters } from "../../query/libraryFilters";
import type { UserState } from "../../session/userState";
import { APP_OWNER_ID, storedKey, type StoredValueKey } from "../storedValues";

/**
 * User-scoped `StoredValues` keys (Swiftfin `StoredValues.Keys.User`).
 *
 * The user list is app-owned; per-user records (`UserDto`, access policy, pin hint) are owned by
 * the user's id so they can be stored/retrieved without an active session. Per-library settings
 * are owned by the user id and named by the library's parent id.
 */
export const UserKeys = {
    /** All saved users across every server. */
    users: (): StoredValueKey<UserState[]> =>
        storedKey<UserState[]>({
            name: "users",
            field: "users",
            ownerID: APP_OWNER_ID,
            storage: "sql",
            default: () => [],
        }),

    /** The cached `UserDto` for a user id. */
    data: (id: string): StoredValueKey<UserDto> =>
        storedKey<UserDto>({
            field: "userData",
            ownerID: id,
            storage: "sql",
            default: () => ({}),
        }),

    /** The local access policy (none / device auth / pin) for a user id. */
    accessPolicy: (id: string): StoredValueKey<LocalUserAccessPolicy> =>
        storedKey<LocalUserAccessPolicy>({
            field: "accessPolicy",
            ownerID: id,
            storage: "sql",
            default: () => "none",
        }),

    /** Grid vs. list presentation for one library (Swiftfin `libraryDisplayType(parentID:)`). */
    libraryDisplayType: (userID: string, parentID: string): StoredValueKey<LibraryDisplayType> =>
        storedKey<LibraryDisplayType>({
            name: parentID,
            field: "libraryDisplayType",
            ownerID: userID,
            storage: "sql",
            default: "grid",
        }),

    /** Sort + filter state for one library (Swiftfin `libraryFilters(parentID:)`). */
    libraryFilters: (userID: string, parentID: string): StoredValueKey<LibraryFilters> =>
        storedKey<LibraryFilters>({
            name: parentID,
            field: "libraryFilters",
            ownerID: userID,
            storage: "sql",
            default: defaultLibraryFilters,
        }),

    /** Items opened from Search, most recent first (ids; see `withRecentItem`). */
    recentSearchItems: (userID: string): StoredValueKey<string[]> =>
        storedKey<string[]>({
            field: "recentSearchItems",
            ownerID: userID,
            storage: "sql",
            default: () => [],
        }),

    /** The optional PIN hint for a user id. */
    pinHint: (id: string): StoredValueKey<string> =>
        storedKey<string>({
            field: "pinHint",
            ownerID: id,
            storage: "sql",
            default: () => "",
        }),
} as const;
