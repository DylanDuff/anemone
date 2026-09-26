//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type ServerState, useCurrentSession } from "@anemone/core";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import { theme } from "./ui/theme";
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
        return <LoadingScreen />;
    }

    if (session) {
        return <RootStack />;
    }

    if (!server) {
        return <ConnectServerScreen onConnected={setServer} />;
    }

    return <SignInScreen server={server} onBack={() => setServer(null)} />;
}

/** A themed full-screen spinner, while the app starts or restores its session. */
export function LoadingScreen() {
    return (
        <View style={styles.loading}>
            <ActivityIndicator color={theme.colors.accent} />
        </View>
    );
}

const styles = StyleSheet.create({
    loading: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: theme.colors.background,
    },
});
