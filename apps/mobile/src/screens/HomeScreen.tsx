//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
    type Api,
    displayTitle,
    useLatestInLibrary,
    useQueryContext,
    useSessionController,
    useUserViews,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { HeroCarousel } from "../ui/HeroCarousel";
import { PosterRow } from "../ui/PosterRow";
import { space, theme } from "../ui/theme";
import { LibraryItemsScreen } from "./LibraryItemsScreen";

/**
 * The signed-in home: a hero carousel of recently-added items across all libraries, followed by a
 * "recently added" poster row per library (Movies, Shows, …). Tapping a row title opens the full
 * library; tapping a poster is a no-op until the item-detail screen exists.
 */
export function HomeScreen() {
    const ctx = useQueryContext();
    const sessionController = useSessionController();
    const { data: views, isLoading: viewsLoading } = useUserViews();
    const recent = useLatestInLibrary(undefined, 12);
    const [openLibrary, setOpenLibrary] = useState<BaseItemDto | null>(null);

    if (openLibrary) {
        return <LibraryItemsScreen library={openLibrary} onBack={() => setOpenLibrary(null)} />;
    }

    const loading = viewsLoading || recent.isLoading;

    return (
        <View style={styles.screen}>
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.topBar}>
                    <Text style={styles.brand}>Anemone</Text>
                    <Pressable onPress={() => void sessionController.signOut()}>
                        <Text style={styles.signOut}>Sign out</Text>
                    </Pressable>
                </View>

                <HeroCarousel api={ctx.api} items={recent.data ?? []} />

                {(views ?? []).map((view) => (
                    <LibraryRow
                        key={view.Id ?? view.Name ?? Math.random().toString()}
                        api={ctx.api}
                        view={view}
                        onOpen={() => setOpenLibrary(view)}
                    />
                ))}

                {loading ? (
                    <ActivityIndicator style={styles.loader} color={theme.colors.accent} />
                ) : null}
                <View style={styles.footer} />
            </ScrollView>
        </View>
    );
}

/** One "recently added" poster row for a single library. */
function LibraryRow({ api, view, onOpen }: { api: Api; view: BaseItemDto; onOpen: () => void }) {
    const { data } = useLatestInLibrary(view.Id ?? undefined, 20);
    return (
        <PosterRow title={displayTitle(view)} items={data ?? []} api={api} onPressTitle={onOpen} />
    );
}

const styles = StyleSheet.create({
    screen: {
        flex: 1,
        backgroundColor: theme.colors.background,
    },
    content: {
        paddingBottom: space(2),
    },
    topBar: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: space(2),
        paddingTop: space(2),
        paddingBottom: space(1.5),
    },
    brand: {
        color: theme.colors.text,
        fontSize: 22,
        fontWeight: "800",
    },
    signOut: {
        color: theme.colors.muted,
        fontSize: 14,
    },
    loader: {
        marginTop: space(3),
    },
    footer: {
        height: space(4),
    },
});
