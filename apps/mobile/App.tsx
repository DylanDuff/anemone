import { type AnemoneContainer, AnemoneProvider, useCurrentSession } from "@anemone/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { configureAnemone } from "./src/bootstrap";

const queryClient = new QueryClient();

/**
 * Placeholder root that reflects the resolved session. This proves the core → app injection works
 * end-to-end; the real UI (connect / sign-in / home / library / item / search) is built next,
 * consuming the view models and query hooks from `@anemone/core`.
 */
function RootStatus() {
    const { session, isLoading } = useCurrentSession();

    let message: string;
    if (isLoading) {
        message = "Resolving session…";
    } else if (session) {
        message = `Signed in as ${session.user.username} @ ${session.server.name}`;
    } else {
        message = "Signed out — connect to a server to begin.";
    }

    return (
        <View style={styles.container}>
            <Text style={styles.title}>Anemone</Text>
            <Text style={styles.body}>{message}</Text>
            <StatusBar style="auto" />
        </View>
    );
}

export default function App() {
    const [container, setContainer] = useState<AnemoneContainer | null>(null);

    useEffect(() => {
        let cancelled = false;
        configureAnemone().then((configured) => {
            if (!cancelled) {
                setContainer(configured);
            }
        });
        return () => {
            cancelled = true;
        };
    }, []);

    if (!container) {
        return (
            <View style={styles.container}>
                <ActivityIndicator />
                <StatusBar style="auto" />
            </View>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <AnemoneProvider container={container}>
                <RootStatus />
            </AnemoneProvider>
        </QueryClientProvider>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: "#fff",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
    },
    title: { fontSize: 24, fontWeight: "600" },
    body: { fontSize: 14, color: "#444", textAlign: "center", paddingHorizontal: 24 },
});
