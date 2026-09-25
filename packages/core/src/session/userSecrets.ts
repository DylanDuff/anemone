//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { SecureStore } from "../container/adapters";

/**
 * Secure per-user secrets (access token, PIN), mirroring Swiftfin's Keychain accessors on
 * `UserState`. Keys match Swiftfin's format: `${id}-accessToken` and `${id}-pin`.
 */
export class UserSecrets {
    constructor(private readonly secureStore: SecureStore) {}

    accessToken(userID: string): string {
        return this.secureStore.get(`${userID}-accessToken`) ?? "";
    }

    setAccessToken(userID: string, token: string): void {
        this.secureStore.set(`${userID}-accessToken`, token);
    }

    deleteAccessToken(userID: string): void {
        this.secureStore.delete(`${userID}-accessToken`);
    }

    pin(userID: string): string {
        return this.secureStore.get(`${userID}-pin`) ?? "";
    }

    setPin(userID: string, pin: string): void {
        this.secureStore.set(`${userID}-pin`, pin);
    }

    deletePin(userID: string): void {
        this.secureStore.delete(`${userID}-pin`);
    }
}
