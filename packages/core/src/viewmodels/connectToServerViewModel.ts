//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { AnemoneContainer } from "../container/container";
import { ErrorMessage } from "../errors/errorMessage";
import { ServerKeys } from "../data/keys/serverKeys";
import { serverStateAddingURL, type ServerState } from "../session/serverState";
import { connectToServer } from "../session/serverConnection";
import {
    createStatefulStore,
    type StatefulStore,
    Transitions,
} from "../stateful/createStatefulStore";

export type ConnectToServerState = "initial" | "connecting";

export type ConnectToServerAction =
    | { readonly kind: "connect"; readonly url: string }
    | { readonly kind: "cancel" }
    | { readonly kind: "addNewURL"; readonly server: ServerState };

export type ConnectToServerEvent =
    | { readonly kind: "connected"; readonly server: ServerState }
    | { readonly kind: "duplicateServer"; readonly server: ServerState }
    | { readonly kind: "error"; readonly error: ErrorMessage };

export interface ConnectToServerData {
    /** Servers found via local discovery (discovery itself is a backlog item). */
    readonly localServers: readonly ServerState[];
}

export type ConnectToServerViewModel = StatefulStore<
    ConnectToServerState,
    never,
    ConnectToServerData,
    ConnectToServerAction,
    ConnectToServerEvent
>;

/**
 * Connect to and save a Jellyfin server, mirroring Swiftfin's `ConnectToServerViewModel`.
 *
 * Dispatch `{ kind: "connect", url }` and observe events: `connected` on success, `duplicateServer`
 * when a server with the same id already exists (the UI may offer to add the new URL), or `error`.
 */
export function createConnectToServerViewModel(
    container: AnemoneContainer,
): ConnectToServerViewModel {
    const isDuplicate = async (server: ServerState): Promise<boolean> => {
        const servers = await container.storedValues.get(ServerKeys.servers());
        return servers.some((existing) => existing.id === server.id);
    };

    return createStatefulStore<
        ConnectToServerState,
        never,
        ConnectToServerData,
        ConnectToServerAction,
        ConnectToServerEvent
    >({
        initialState: "initial",
        initialData: { localServers: [] },
        transition(action) {
            switch (action.kind) {
                case "cancel":
                    return Transitions.to("initial");
                case "connect":
                    return Transitions.loop("connecting");
                case "addNewURL":
                    return Transitions.none();
            }
        },
        async handle(action, context) {
            switch (action.kind) {
                case "cancel":
                    return;

                case "connect": {
                    const { server, publicInfo } = await connectToServer(
                        container.clientFactory,
                        action.url,
                    );

                    if (await isDuplicate(server)) {
                        context.emit({ kind: "duplicateServer", server });
                        return;
                    }

                    // Persist directly with the info we already fetched (avoids a second call).
                    const servers = await container.storedValues.get(ServerKeys.servers());
                    await container.storedValues.set(ServerKeys.servers(), [...servers, server]);
                    await container.storedValues.set(ServerKeys.publicInfo(server.id), publicInfo);

                    context.emit({ kind: "connected", server });
                    return;
                }

                case "addNewURL": {
                    const servers = await container.storedValues.get(ServerKeys.servers());
                    const index = servers.findIndex((existing) => existing.id === action.server.id);
                    if (index < 0) {
                        throw new ErrorMessage("Could not find server to add new URL");
                    }

                    const existing = servers[index]!;
                    const updated = serverStateAddingURL(existing, action.server.currentURL);
                    const next = servers.slice();
                    next[index] = updated;
                    await container.storedValues.set(ServerKeys.servers(), next);

                    container.resetCurrentUserSession();
                    return;
                }
            }
        },
    });
}
