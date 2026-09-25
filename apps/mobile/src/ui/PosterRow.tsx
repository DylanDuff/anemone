//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { Api } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Poster } from "./Poster";
import { space, theme } from "./theme";

/** A titled, horizontally-scrolling row of posters. Renders nothing when there are no items. */
export function PosterRow({
    title,
    items,
    api,
    onPressItem,
    onPressTitle,
}: {
    title: string;
    items: readonly BaseItemDto[];
    api: Api;
    onPressItem?: (item: BaseItemDto) => void;
    onPressTitle?: () => void;
}) {
    if (items.length === 0) {
        return null;
    }

    return (
        <View style={styles.section}>
            <Pressable onPress={onPressTitle} disabled={!onPressTitle} style={styles.headerRow}>
                <Text style={styles.header}>{title}</Text>
                {onPressTitle ? <Text style={styles.seeAll}>See all ›</Text> : null}
            </Pressable>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.row}
            >
                {items.map((item) => (
                    <Poster
                        key={item.Id ?? item.Name ?? Math.random().toString()}
                        api={api}
                        item={item}
                        onPress={onPressItem}
                    />
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    section: {
        marginTop: space(3),
    },
    headerRow: {
        flexDirection: "row",
        alignItems: "baseline",
        justifyContent: "space-between",
        paddingHorizontal: space(2),
        marginBottom: space(1.5),
    },
    header: {
        color: theme.colors.text,
        fontSize: 19,
        fontWeight: "700",
    },
    seeAll: {
        color: theme.colors.muted,
        fontSize: 13,
    },
    row: {
        paddingHorizontal: space(2),
        gap: space(1.5),
    },
});
