//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

/**
 * How a locally-saved user must be authenticated before use, mirroring Swiftfin's
 * `LocalUserAccessPolicy`. `requireDeviceAuthentication` uses biometrics/passcode; `requirePin`
 * uses an app-managed PIN stored in the secure store.
 */
export type LocalUserAccessPolicy = "none" | "requireDeviceAuthentication" | "requirePin";

export const localUserAccessPolicyValues: readonly LocalUserAccessPolicy[] = [
    "none",
    "requireDeviceAuthentication",
    "requirePin",
];
