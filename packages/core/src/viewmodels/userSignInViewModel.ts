//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { UserDto } from "@jellyfin/sdk/lib/generated-client/models/user-dto";
import type { AnemoneContainer } from "../container/container";
import { ServerKeys } from "../data/keys/serverKeys";
import { UserKeys } from "../data/keys/userKeys";
import {
    getAuthenticationApi,
    getBrandingApi,
    getUserApi,
} from "../jellyfin/api";
import type { LocalUserAccessPolicy } from "../models/localUserAccessPolicy";
import {
    type AuthenticationResult,
    signIn,
    signInWithQuickConnect,
} from "../session/authentication";
import type { ServerState } from "../session/serverState";
import { makeUserState, type UserState } from "../session/userState";
import {
    createStatefulStore,
    type StatefulStore,
    Transitions,
} from "../stateful/createStatefulStore";

export type UserSignInViewState = "initial" | "signingIn";
export type UserSignInBackgroundState = "gettingPublicData";

/**
 * A decided access policy for a user being saved. The biometric/PIN capture itself is
 * platform-specific and is the app's responsibility (see backlog); core receives the outcome:
 * `requirePin` carries the chosen `pin` (and optional `pinHint`).
 */
export interface DecidedAccessPolicy {
    readonly policy: LocalUserAccessPolicy;
    readonly pin?: string;
    readonly pinHint?: string;
}

export interface SaveUserRequest {
    readonly auth: AuthenticationResult;
    readonly access: DecidedAccessPolicy;
}

export type UserSignInAction =
    | { readonly kind: "getPublicData" }
    | { readonly kind: "signIn"; readonly username: string; readonly password: string }
    | { readonly kind: "signInQuickConnect"; readonly secret: string }
    | { readonly kind: "save"; readonly request: SaveUserRequest }
    | { readonly kind: "cancel" };

export type UserSignInEvent =
    | { readonly kind: "connected"; readonly auth: AuthenticationResult }
    | { readonly kind: "existingUser"; readonly auth: AuthenticationResult }
    | { readonly kind: "saved"; readonly user: UserState };

export interface UserSignInData {
    readonly isQuickConnectEnabled: boolean;
    readonly publicUsers: readonly UserDto[];
    readonly serverDisclaimer: string | null;
}

export type UserSignInViewModel = StatefulStore<
    UserSignInViewState,
    UserSignInBackgroundState,
    UserSignInData,
    UserSignInAction,
    UserSignInEvent
>;

/**
 * Sign a user in to a server, mirroring Swiftfin's `UserSignInViewModel`.
 *
 * Flow: dispatch `getPublicData` to populate public users / quick-connect / disclaimer, then
 * `signIn`/`signInQuickConnect`. On success the VM emits `connected` (new user — the UI collects an
 * access policy and dispatches `save`) or `existingUser` (already saved). `save` persists the user
 * and emits `saved`.
 */
export function createUserSignInViewModel(
    container: AnemoneContainer,
    server: ServerState,
): UserSignInViewModel {
    const publicApi = container.clientFactory.createApi(server.currentURL);

    const findExistingUser = async (userID: string): Promise<UserState | undefined> => {
        const users = await container.storedValues.get(UserKeys.users());
        return users.find((user) => user.id === userID);
    };

    const emitAfterAuth = async (
        auth: AuthenticationResult,
        emit: (event: UserSignInEvent) => void,
    ): Promise<void> => {
        const existing = await findExistingUser(auth.userID);
        emit({ kind: existing ? "existingUser" : "connected", auth });
    };

    const persistUser = async (request: SaveUserRequest): Promise<UserState> => {
        const { auth, access } = request;
        const userState = makeUserState({
            id: auth.userID,
            serverID: server.id,
            username: auth.username,
        });

        // Upsert into the users list.
        const users = await container.storedValues.get(UserKeys.users());
        const nextUsers = users.filter((user) => user.id !== userState.id);
        nextUsers.push(userState);
        await container.storedValues.set(UserKeys.users(), nextUsers);

        // Attach the user id to its server.
        const servers = await container.storedValues.get(ServerKeys.servers());
        const index = servers.findIndex((candidate) => candidate.id === server.id);
        if (index >= 0) {
            const existingServer = servers[index]!;
            if (!existingServer.userIDs.includes(userState.id)) {
                const next = servers.slice();
                next[index] = {
                    ...existingServer,
                    userIDs: [...existingServer.userIDs, userState.id],
                };
                await container.storedValues.set(ServerKeys.servers(), next);
            }
        }

        // Secrets + per-user data.
        container.userSecrets.setAccessToken(userState.id, auth.accessToken);
        await container.storedValues.set(UserKeys.data(userState.id), auth.user);
        await container.storedValues.set(UserKeys.accessPolicy(userState.id), access.policy);
        if (access.policy === "requirePin" && access.pin != null) {
            container.userSecrets.setPin(userState.id, access.pin);
            await container.storedValues.set(UserKeys.pinHint(userState.id), access.pinHint ?? "");
        }

        return userState;
    };

    return createStatefulStore<
        UserSignInViewState,
        UserSignInBackgroundState,
        UserSignInData,
        UserSignInAction,
        UserSignInEvent
    >({
        initialState: "initial",
        initialData: { isQuickConnectEnabled: false, publicUsers: [], serverDisclaimer: null },
        transition(action) {
            switch (action.kind) {
                case "cancel":
                    return Transitions.to("initial");
                case "getPublicData":
                    return Transitions.background("gettingPublicData");
                case "signIn":
                case "signInQuickConnect":
                    return Transitions.loop("signingIn");
                case "save":
                    return Transitions.none();
            }
        },
        async handle(action, context) {
            switch (action.kind) {
                case "cancel":
                    return;

                case "getPublicData": {
                    const [isQuickConnectEnabled, publicUsers, serverDisclaimer] = await Promise.all([
                        getAuthenticationApi(publicApi)
                            .getQuickConnectEnabled()
                            .then((r) => r.data)
                            .catch(() => false),
                        getUserApi(publicApi)
                            .getPublicUsers()
                            .then((r) => r.data)
                            .catch(() => []),
                        getBrandingApi(publicApi)
                            .getBrandingOptions()
                            .then((r) => r.data.LoginDisclaimer || null)
                            .catch(() => null),
                    ]);
                    context.setData({ isQuickConnectEnabled, publicUsers, serverDisclaimer });
                    return;
                }

                case "signIn": {
                    const auth = await signIn(publicApi, action.username, action.password);
                    await emitAfterAuth(auth, context.emit);
                    return;
                }

                case "signInQuickConnect": {
                    const auth = await signInWithQuickConnect(publicApi, action.secret);
                    await emitAfterAuth(auth, context.emit);
                    return;
                }

                case "save": {
                    const user = await persistUser(action.request);
                    context.emit({ kind: "saved", user });
                    return;
                }
            }
        },
    });
}
