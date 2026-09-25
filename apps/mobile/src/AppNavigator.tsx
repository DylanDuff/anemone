//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type ServerState, useCurrentSession } from "@anemone/core";
import { Host, Text } from "@expo/ui";
import { useState } from "react";
import { ConnectServerScreen } from "./screens/ConnectServerScreen";
import { LibraryScreen } from "./screens/LibraryScreen";
import { SignInScreen } from "./screens/SignInScreen";

/**
 * Minimal session-driven flow: connect → sign in → library. When a session exists the library is
 * shown; otherwise the user connects to a server and signs in. Proper routing (expo-router) and the
 * select-user screen are follow-ups — see docs/BACKLOG.md.
 */
export function AppNavigator() {
    const { session, isLoading } = useCurrentSession();
    const [server, setServer] = useState<ServerState | null>(null);

    if (isLoading) {
        return (
            <Host style={{ flex: 1, padding: 24 }}>
                <Text>Loading…</Text>
            </Host>
        );
    }

    if (session) {
        return <LibraryScreen />;
    }

    if (!server) {
        return <ConnectServerScreen onConnected={setServer} />;
    }

    return <SignInScreen server={server} onBack={() => setServer(null)} />;
}
