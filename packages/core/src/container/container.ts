//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { AppDefaults } from "../data/keys/appDefaults";
import { ServerKeys } from "../data/keys/serverKeys";
import { UserKeys } from "../data/keys/userKeys";
import { AnyDataStore } from "../data/anyData";
import { Defaults } from "../data/defaults";
import { StoredValues } from "../data/storedValues";
import { type Logger, noopLogger } from "../logging/logger";
import { isSignedIn, signedOut } from "../models/userSignInState";
import { makeUserSession, type UserSession } from "../session/userSession";
import { UserSecrets } from "../session/userSecrets";
import { type ClientIdentity, JellyfinClientFactory } from "../jellyfin/client";
import type { AnemoneDatabase, KeyValueStore, SecureStore } from "./adapters";

/** Everything the app must supply at startup for core to run. */
export interface ContainerConfig {
    /**
     * The SQLite database for `sql`-backed values. Optional: omit it (or set
     * `storageMode: 'defaults'`) on platforms without SQLite (web, tvOS), where all values are
     * routed to the key/value store instead.
     */
    database?: AnemoneDatabase;
    secureStore: SecureStore;
    keyValueStore: KeyValueStore;
    identity: ClientIdentity;
    logger?: Logger;
    /**
     * How persisted values are stored. `'auto'` (default) uses each key's own destination and
     * requires a `database` for `sql` keys. `'defaults'` forces everything through the key/value
     * store (no SQLite) — the web/tvOS mode. Omitting `database` implies `'defaults'`.
     */
    storageMode?: "auto" | "defaults";
}

/**
 * The dependency container, mirroring Swiftfin's `Factory` `Container`. It wires the injected
 * platform adapters into the persistence + session services and caches the resolved current
 * session (Swiftfin's `.cached` `currentUserSession`).
 *
 * Create one explicitly for tests, or use the module-global one the app configures at startup.
 */
export class AnemoneContainer {
    readonly database: AnemoneDatabase | undefined;
    readonly secureStore: SecureStore;
    readonly keyValueStore: KeyValueStore;
    readonly logger: Logger;

    readonly anyData: AnyDataStore | undefined;
    readonly storedValues: StoredValues;
    readonly defaults: Defaults;
    readonly userSecrets: UserSecrets;
    readonly clientFactory: JellyfinClientFactory;

    // `undefined` = not yet resolved; `null` = resolved to "signed out".
    private cachedSession: UserSession | null | undefined = undefined;

    constructor(config: ContainerConfig) {
        this.database = config.database;
        this.secureStore = config.secureStore;
        this.keyValueStore = config.keyValueStore;
        this.logger = config.logger ?? noopLogger;

        const useDefaultsOnly = config.storageMode === "defaults" || !config.database;
        this.anyData = config.database ? new AnyDataStore(config.database) : undefined;
        this.storedValues = new StoredValues(this.anyData, config.keyValueStore, useDefaultsOnly);
        this.defaults = new Defaults(config.keyValueStore);
        this.userSecrets = new UserSecrets(config.secureStore);
        this.clientFactory = new JellyfinClientFactory(config.identity);
    }

    /**
     * Resolve the current user session from `lastSignedInUserID`, the saved users and servers.
     * Returns `null` when signed out or when the saved data is inconsistent (in which case it
     * resets to signed out, matching Swiftfin). The result is cached until invalidated.
     */
    async currentUserSession(): Promise<UserSession | null> {
        if (this.cachedSession !== undefined) {
            return this.cachedSession;
        }

        const session = await this.resolveCurrentUserSession();
        this.cachedSession = session;
        return session;
    }

    private async resolveCurrentUserSession(): Promise<UserSession | null> {
        const lastSignedIn = this.defaults.get(AppDefaults.lastSignedInUserID());
        if (!isSignedIn(lastSignedIn)) {
            return null;
        }

        const users = await this.storedValues.get(UserKeys.users());
        const user = users.find((candidate) => candidate.id === lastSignedIn.userID);
        if (!user) {
            // Had a last user id but no saved user — reset.
            this.defaults.set(AppDefaults.lastSignedInUserID(), signedOut);
            return null;
        }

        const servers = await this.storedValues.get(ServerKeys.servers());
        const server = servers.find((candidate) => candidate.id === user.serverID);
        if (!server) {
            this.defaults.set(AppDefaults.lastSignedInUserID(), signedOut);
            return null;
        }

        const accessToken = this.userSecrets.accessToken(user.id);
        const api = this.clientFactory.createApi(server.currentURL, accessToken);
        return makeUserSession(api, server, user);
    }

    /** Invalidate the cached session (e.g. after the current server URL changes). */
    resetCurrentUserSession(): void {
        this.cachedSession = undefined;
    }

    /** Sign the given user in as the current user, invalidating any cached session. */
    async setCurrentUser(userID: string): Promise<void> {
        this.defaults.set(AppDefaults.lastSignedInUserID(), { kind: "signedIn", userID });
        this.resetCurrentUserSession();
    }

    /** Sign out of the current user without deleting the saved account. */
    signOut(): void {
        this.defaults.set(AppDefaults.lastSignedInUserID(), signedOut);
        this.resetCurrentUserSession();
    }
}

let globalContainer: AnemoneContainer | null = null;

/** Configure the module-global container. The app calls this once at startup. */
export function configureContainer(config: ContainerConfig): AnemoneContainer {
    globalContainer = new AnemoneContainer(config);
    return globalContainer;
}

/** Access the module-global container. Throws if `configureContainer` has not been called. */
export function getContainer(): AnemoneContainer {
    if (!globalContainer) {
        throw new Error(
            "AnemoneContainer is not configured. Call configureContainer(...) at app startup.",
        );
    }
    return globalContainer;
}

/** Clear the module-global container (primarily for tests). */
export function resetContainer(): void {
    globalContainer = null;
}
