//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { AnemoneContainer } from "../container/container";
import { ErrorMessage } from "../errors/errorMessage";
import { ServerKeys } from "../data/keys/serverKeys";
import { UserKeys } from "../data/keys/userKeys";
import type { ServerState } from "../session/serverState";
import { deleteUser } from "../session/userManagement";
import type { UserState } from "../session/userState";
import {
    createStatefulStore,
    type StatefulStore,
    Transitions,
} from "../stateful/createStatefulStore";

export type SelectUserState = "initial" | "loading" | "content";
export type SelectUserBackgroundState = "refreshing";

/** A server together with the users saved for it, sorted for display. */
export interface ServerUsers {
    readonly server: ServerState;
    readonly users: readonly UserState[];
}

export type SelectUserAction =
    | { readonly kind: "getServers" }
    | { readonly kind: "deleteUsers"; readonly users: readonly UserState[] }
    | { readonly kind: "signIn"; readonly user: UserState; readonly pin: string };

export type SelectUserEvent = { readonly kind: "signedIn"; readonly user: UserState };

export interface SelectUserData {
    /** Servers with their users, ordered by server name then username. */
    readonly servers: readonly ServerUsers[];
}

export type SelectUserViewModel = StatefulStore<
    SelectUserState,
    SelectUserBackgroundState,
    SelectUserData,
    SelectUserAction,
    SelectUserEvent
>;

/**
 * List saved servers/users, delete users, and sign in an existing user, mirroring Swiftfin's
 * `SelectUserViewModel`. On a successful `signIn` the user is made the current user (via the
 * container) and a `signedIn` event is emitted for the UI to navigate.
 */
export function createSelectUserViewModel(container: AnemoneContainer): SelectUserViewModel {
    const loadServers = async (): Promise<readonly ServerUsers[]> => {
        const [servers, users] = await Promise.all([
            container.storedValues.get(ServerKeys.servers()),
            container.storedValues.get(UserKeys.users()),
        ]);

        const usersByServer = new Map<string, UserState[]>();
        for (const user of users) {
            const list = usersByServer.get(user.serverID) ?? [];
            list.push(user);
            usersByServer.set(user.serverID, list);
        }

        return [...servers]
            .sort((a, b) => a.name.localeCompare(b.name))
            .map((server) => ({
                server,
                users: (usersByServer.get(server.id) ?? []).sort((a, b) =>
                    a.username.localeCompare(b.username),
                ),
            }));
    };

    return createStatefulStore<
        SelectUserState,
        SelectUserBackgroundState,
        SelectUserData,
        SelectUserAction,
        SelectUserEvent
    >({
        initialState: "initial",
        initialData: { servers: [] },
        transition(action) {
            switch (action.kind) {
                case "getServers":
                    return Transitions.to("loading", "content");
                case "deleteUsers":
                    return Transitions.background("refreshing");
                case "signIn":
                    return Transitions.none();
            }
        },
        async handle(action, context) {
            switch (action.kind) {
                case "getServers": {
                    context.setData({ servers: await loadServers() });
                    return;
                }

                case "deleteUsers": {
                    for (const user of action.users) {
                        await deleteUser(container, user);
                    }
                    context.setData({ servers: await loadServers() });
                    return;
                }

                case "signIn": {
                    const { user, pin } = action;
                    const policy = await container.storedValues.get(UserKeys.accessPolicy(user.id));
                    if (policy === "requirePin") {
                        const storedPin = container.userSecrets.pin(user.id);
                        if (pin !== storedPin) {
                            throw new ErrorMessage(`Incorrect PIN for ${user.username}`);
                        }
                    }

                    await container.setCurrentUser(user.id);
                    context.emit({ kind: "signedIn", user });
                    return;
                }
            }
        },
    });
}
