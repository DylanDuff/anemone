import { type AnemoneContainer, AnemoneProvider } from "@anemone/core";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { useEffect, useState } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AppNavigator, LoadingScreen } from "./src/AppNavigator";
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

    return (
        <SafeAreaProvider>
            {container ? (
                <QueryClientProvider client={queryClient}>
                    <AnemoneProvider container={container}>
                        <AppNavigator />
                    </AnemoneProvider>
                </QueryClientProvider>
            ) : (
                <LoadingScreen />
            )}
            {/* Light content over the dark theme. */}
            <StatusBar style="light" />
        </SafeAreaProvider>
    );
}
