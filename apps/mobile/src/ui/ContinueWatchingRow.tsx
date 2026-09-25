//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
    type Api,
    displayTitle,
    playedFraction,
    resumeFrameSource,
    seasonEpisodeLabel,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { space, theme } from "./theme";

const CARD_WIDTH = 260;
const CARD_HEIGHT = Math.round((CARD_WIDTH * 9) / 16);

function titleFor(item: BaseItemDto): string {
    if (item.Type === BaseItemKind.Episode && item.SeriesName) {
        return item.SeriesName;
    }
    return displayTitle(item);
}

function subtitleFor(item: BaseItemDto): string | undefined {
    if (item.Type === BaseItemKind.Episode) {
        return [seasonEpisodeLabel(item), displayTitle(item)].filter(Boolean).join("  ");
    }
    return item.ProductionYear ? String(item.ProductionYear) : undefined;
}

function ContinueWatchingCard({
    api,
    item,
    onPress,
}: {
    api: Api;
    item: BaseItemDto;
    onPress?: (item: BaseItemDto) => void;
}) {
    const url = resumeFrameSource(api, item).url;
    const fraction = playedFraction(item) ?? 0;
    const subtitle = subtitleFor(item);

    return (
        <Pressable
            onPress={() => onPress?.(item)}
            style={({ pressed }) => [styles.card, pressed ? styles.pressed : null]}
        >
            <View style={styles.thumb}>
                {url ? (
                    <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
                ) : (
                    <View style={[styles.image, styles.placeholder]} />
                )}
                <View style={styles.progressTrack}>
                    <View style={[styles.progressFill, { width: `${Math.round(fraction * 100)}%` }]} />
                </View>
            </View>
            <Text numberOfLines={1} style={styles.title}>
                {titleFor(item)}
            </Text>
            {subtitle ? (
                <Text numberOfLines={1} style={styles.subtitle}>
                    {subtitle}
                </Text>
            ) : null}
        </Pressable>
    );
}

/** "Continue Watching" — landscape resume cards with a progress bar. Hidden when empty. */
export function ContinueWatchingRow({
    api,
    items,
    onPressItem,
}: {
    api: Api;
    items: readonly BaseItemDto[];
    onPressItem?: (item: BaseItemDto) => void;
}) {
    if (items.length === 0) {
        return null;
    }

    return (
        <View style={styles.section}>
            <Text style={styles.header}>Continue Watching</Text>
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.row}
            >
                {items.map((item) => (
                    <ContinueWatchingCard
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
    header: {
        color: theme.colors.text,
        fontSize: 19,
        fontWeight: "700",
        paddingHorizontal: space(2),
        marginBottom: space(1.5),
    },
    row: {
        paddingHorizontal: space(2),
        gap: space(1.5),
    },
    card: {
        width: CARD_WIDTH,
    },
    pressed: {
        opacity: 0.7,
    },
    thumb: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
        borderRadius: theme.poster.radius,
        overflow: "hidden",
        backgroundColor: theme.colors.placeholder,
    },
    image: {
        width: CARD_WIDTH,
        height: CARD_HEIGHT,
    },
    placeholder: {
        backgroundColor: theme.colors.surface,
    },
    progressTrack: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: 4,
        backgroundColor: theme.colors.overlayStrong,
    },
    progressFill: {
        height: 4,
        backgroundColor: theme.colors.accent,
    },
    title: {
        color: theme.colors.text,
        fontSize: 14,
        marginTop: space(0.75),
    },
    subtitle: {
        color: theme.colors.muted,
        fontSize: 12,
        marginTop: space(0.25),
    },
});
