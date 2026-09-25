//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { createStore, type StoreApi } from "zustand/vanilla";
import type { AnemoneContainer } from "../container/container";
import type { UserSession } from "./userSession";

export interface SessionSnapshot {
    /** The resolved current session, or `null` when signed out. */
    readonly session: UserSession | null;
    /** True while the initial (or a subsequent) resolution is in flight. */
    readonly isLoading: boolean;
}

/**
 * A reactive wrapper over `AnemoneContainer.currentUserSession`, giving the UI something observable
 * to drive the signed-in/out root. This is the piece Swiftfin's `RootCoordinator` reacts to via the
 * `didChangeCurrentServerURL` / session notifications.
 *
 * Framework-agnostic (vanilla zustand); React consumers read it via `useCurrentSession`.
 */
export class SessionController {
    readonly store: StoreApi<SessionSnapshot>;

    constructor(private readonly container: AnemoneContainer) {
        this.store = createStore<SessionSnapshot>(() => ({ session: null, isLoading: true }));
    }

    getSession(): UserSession | null {
        return this.store.getState().session;
    }

    /** Re-resolve the current session from persisted state. */
    async refresh(): Promise<UserSession | null> {
        this.store.setState({ isLoading: true });
        this.container.resetCurrentUserSession();
        const session = await this.container.currentUserSession();
        this.store.setState({ session, isLoading: false });
        return session;
    }

    /** Make a user current and refresh (call after a successful sign-in). */
    async setCurrentUser(userID: string): Promise<UserSession | null> {
        await this.container.setCurrentUser(userID);
        return this.refresh();
    }

    /** Sign out and refresh. */
    async signOut(): Promise<void> {
        this.container.signOut();
        await this.refresh();
    }
}
