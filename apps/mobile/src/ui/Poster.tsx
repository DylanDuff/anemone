//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type Api, displayTitle, ImageType, itemImageSource } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { Image, Pressable, StyleSheet, Text, View } from "react-native";
import { space, theme } from "./theme";

const POSTER_WIDTH = theme.poster.width;
const POSTER_HEIGHT = POSTER_WIDTH / theme.poster.aspectRatio;

/** A tappable portrait poster with a title caption. Falls back to a titled placeholder card. */
export function Poster({
    api,
    item,
    onPress,
}: {
    api: Api;
    item: BaseItemDto;
    onPress?: (item: BaseItemDto) => void;
}) {
    const url = itemImageSource(api, item, ImageType.Primary).url;
    const title = displayTitle(item);

    return (
        <Pressable
            onPress={() => onPress?.(item)}
            style={({ pressed }) => [styles.container, pressed ? styles.pressed : null]}
        >
            {url ? (
                <Image source={{ uri: url }} style={styles.image} resizeMode="cover" />
            ) : (
                <View style={[styles.image, styles.placeholder]}>
                    <Text numberOfLines={3} style={styles.placeholderText}>
                        {title}
                    </Text>
                </View>
            )}
            <Text numberOfLines={1} style={styles.caption}>
                {title}
            </Text>
        </Pressable>
    );
}

const styles = StyleSheet.create({
    container: {
        width: POSTER_WIDTH,
    },
    pressed: {
        opacity: 0.7,
    },
    image: {
        width: POSTER_WIDTH,
        height: POSTER_HEIGHT,
        borderRadius: theme.poster.radius,
        backgroundColor: theme.colors.placeholder,
    },
    placeholder: {
        alignItems: "center",
        justifyContent: "center",
        padding: space(1),
    },
    placeholderText: {
        color: theme.colors.muted,
        fontSize: 12,
        textAlign: "center",
    },
    caption: {
        color: theme.colors.text,
        fontSize: 13,
        marginTop: space(0.75),
    },
});
