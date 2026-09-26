//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type ServerState, useCurrentSession } from "@anemone/core";
import { Host, Text } from "@expo/ui";
import { useState } from "react";
import { ConnectServerScreen } from "./screens/ConnectServerScreen";
import { RootStack } from "./navigation/RootStack";
import { SignInScreen } from "./screens/SignInScreen";

/**
 * Session-driven flow: connect → sign in → the signed-in navigation stack (`RootStack`). The auth
 * steps stay state-based; the select-user screen is a follow-up — see docs/BACKLOG.md.
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
        return <RootStack />;
    }

    if (!server) {
        return <ConnectServerScreen onConnected={setServer} />;
    }

    return <SignInScreen server={server} onBack={() => setServer(null)} />;
}
