//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type ServerState, useCurrentSession } from "@anemone/core";
import { useCallback, useEffect, useState } from "react";
import { StyleSheet, View } from "react-native";
import { theme } from "./ui/theme";
import { ConnectServerScreen } from "./screens/ConnectServerScreen";
import { RootStack } from "./navigation/RootStack";
import { SelectUserScreen } from "./screens/SelectUserScreen";
import { SignInScreen } from "./screens/SignInScreen";
import { Spinner } from "./ui/Spinner";

/** Where the signed-out flow is. `connect` can go back only when it was opened from the picker. */
type AuthStep =
    | { readonly kind: "picker" }
    | { readonly kind: "connect"; readonly canGoBack: boolean }
    | { readonly kind: "signIn"; readonly server: ServerState };

/**
 * Session-driven flow. Signed out: the user picker (saved accounts), which hands off to connect /
 * sign in for new servers and accounts — or goes straight to connect when nothing is saved.
 * Signed in: the navigation stack (`RootStack`). The auth steps stay state-based.
 */
export function AppNavigator() {
    const { session, isLoading } = useCurrentSession();
    const [step, setStep] = useState<AuthStep>({ kind: "picker" });

    // Signing out (or switching user) always lands on the picker, whichever step signed in.
    useEffect(() => {
        if (session) {
            setStep({ kind: "picker" });
        }
    }, [session]);

    const showPicker = useCallback(() => setStep({ kind: "picker" }), []);
    const showFirstConnect = useCallback(() => setStep({ kind: "connect", canGoBack: false }), []);
    const signInTo = useCallback((server: ServerState) => setStep({ kind: "signIn", server }), []);

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (session) {
        return <RootStack />;
    }

    switch (step.kind) {
        case "picker":
            return (
                <SelectUserScreen
                    onAddUser={signInTo}
                    onAddServer={() => setStep({ kind: "connect", canGoBack: true })}
                    onEmpty={showFirstConnect}
                />
            );
        case "connect":
            return (
                <ConnectServerScreen
                    onConnected={signInTo}
                    onBack={step.canGoBack ? showPicker : undefined}
                />
            );
        case "signIn":
            return <SignInScreen server={step.server} onBack={showPicker} />;
    }
}

/** A themed full-screen spinner, while the app starts or restores its session. */
export function LoadingScreen() {
    return (
        <View style={styles.loading}>
            <Spinner />
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
