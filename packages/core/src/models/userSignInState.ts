//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

/**
 * Which user (if any) the app is signed in as, mirroring Swiftfin's `UserSignInState`.
 * Persisted as `Defaults[.lastSignedInUserID]` and consulted when resolving the current session.
 */
export type UserSignInState =
    | { readonly kind: "signedOut" }
    | { readonly kind: "signedIn"; readonly userID: string };

export const signedOut: UserSignInState = { kind: "signedOut" };

export function signedIn(userID: string): UserSignInState {
    return { kind: "signedIn", userID };
}

export function isSignedIn(
    state: UserSignInState,
): state is { kind: "signedIn"; userID: string } {
    return state.kind === "signedIn";
}
