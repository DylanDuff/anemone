import { type AnemoneContainer, AnemoneProvider } from "@anemone/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Host, Text } from "@expo/ui";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { AppNavigator } from "./src/AppNavigator";
import { configureAnemone } from "./src/bootstrap";

const queryClient = new QueryClient();

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
            <Host style={{ flex: 1, padding: 24 }}>
                <Text>Starting Anemone…</Text>
            </Host>
        );
    }

    return (
        <QueryClientProvider client={queryClient}>
            <AnemoneProvider container={container}>
                <AppNavigator />
                <StatusBar style="auto" />
            </AnemoneProvider>
        </QueryClientProvider>
    );
}
