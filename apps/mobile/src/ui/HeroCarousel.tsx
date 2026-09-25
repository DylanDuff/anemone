//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
    type Api,
    displayTitle,
    ImageType,
    itemImageSource,
    itemImageURLById,
    premiereYear,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { useEffect, useRef, useState } from "react";
import {
    Image,
    type NativeScrollEvent,
    type NativeSyntheticEvent,
    Pressable,
    ScrollView,
    StyleSheet,
    Text,
    useWindowDimensions,
    View,
} from "react-native";
import { space, theme } from "./theme";

const AUTO_ADVANCE_MS = 6000;

function heroImageURL(api: Api, item: BaseItemDto): string | undefined {
    if (item.BackdropImageTags && item.BackdropImageTags.length > 0 && item.Id) {
        return itemImageURLById(api, item.Id, ImageType.Backdrop);
    }
    return itemImageSource(api, item, ImageType.Primary).url;
}

function subtitle(item: BaseItemDto): string {
    const parts = [premiereYear(item), item.Type].filter(Boolean) as string[];
    return parts.join("  •  ");
}

/** A full-bleed, auto-advancing carousel of featured (recently added) items. */
export function HeroCarousel({
    api,
    items,
    onPressItem,
}: {
    api: Api;
    items: readonly BaseItemDto[];
    onPressItem?: (item: BaseItemDto) => void;
}) {
    const { width } = useWindowDimensions();
    const height = Math.round(Math.min(Math.max(width * 0.62, 260), 460));
    const scrollRef = useRef<ScrollView>(null);
    const indexRef = useRef(0);
    const [active, setActive] = useState(0);

    useEffect(() => {
        if (items.length <= 1) {
            return;
        }
        const timer = setInterval(() => {
            const next = (indexRef.current + 1) % items.length;
            scrollRef.current?.scrollTo({ x: next * width, animated: true });
        }, AUTO_ADVANCE_MS);
        return () => clearInterval(timer);
    }, [items.length, width]);

    if (items.length === 0) {
        return <View style={{ height }} />;
    }

    const onScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
        const index = Math.round(event.nativeEvent.contentOffset.x / width);
        indexRef.current = index;
        if (index !== active) {
            setActive(index);
        }
    };

    return (
        <View>
            <ScrollView
                ref={scrollRef}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
            >
                {items.map((item) => {
                    const url = heroImageURL(api, item);
                    return (
                        <Pressable
                            key={item.Id ?? item.Name ?? Math.random().toString()}
                            onPress={() => onPressItem?.(item)}
                            style={{ width, height }}
                        >
                            {url ? (
                                <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
                            ) : (
                                <View style={[styles.image, styles.placeholder]} />
                            )}
                            <View style={styles.scrim} />
                            <View style={styles.caption}>
                                <Text numberOfLines={2} style={styles.title}>
                                    {displayTitle(item)}
                                </Text>
                                {subtitle(item) ? (
                                    <Text style={styles.subtitle}>{subtitle(item)}</Text>
                                ) : null}
                            </View>
                        </Pressable>
                    );
                })}
            </ScrollView>
            {items.length > 1 ? (
                <View style={styles.dots}>
                    {items.map((item, index) => (
                        <View
                            key={item.Id ?? index}
                            style={[styles.dot, index === active ? styles.dotActive : null]}
                        />
                    ))}
                </View>
            ) : null}
        </View>
    );
}

const styles = StyleSheet.create({
    image: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.colors.placeholder,
    },
    placeholder: {
        backgroundColor: theme.colors.surface,
    },
    scrim: {
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: theme.colors.overlaySoft,
    },
    caption: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        padding: space(2.5),
        backgroundColor: theme.colors.overlayStrong,
    },
    title: {
        color: theme.colors.text,
        fontSize: 26,
        fontWeight: "800",
    },
    subtitle: {
        color: theme.colors.muted,
        fontSize: 14,
        marginTop: space(0.5),
    },
    dots: {
        flexDirection: "row",
        gap: space(0.75),
        justifyContent: "center",
        marginTop: space(1.5),
    },
    dot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: theme.colors.placeholder,
    },
    dotActive: {
        backgroundColor: theme.colors.accent,
        width: 20,
    },
});
