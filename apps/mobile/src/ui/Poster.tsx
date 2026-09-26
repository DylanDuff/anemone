//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type Api, displayTitle, ImageType, isPlayed, itemImageSource } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { Image, StyleSheet, Text, View } from "react-native";
import {
  Focusable,
  focusGlow,
  focusLift,
  FocusRing,
  hoverTransition,
  useFocusIndicator,
} from "./Focusable";
import { Icon } from "./Icon";
import { space, theme } from "./theme";
import { imagePixelWidth } from "./imageSize";

/** Top-right badge: unplayed-episode count for a series, else a check (rendered as an icon). */
function watchedBadge(item: BaseItemDto): string | "played" | undefined {
  const unplayed = item.UserData?.UnplayedItemCount ?? 0;
  if (unplayed > 0) {
    return String(unplayed);
  }
  return isPlayed(item) ? "played" : undefined;
}

/** A tappable portrait poster with a title caption. Falls back to a titled placeholder card. */
export function Poster({
  api,
  item,
  width = theme.poster.width,
  showCaption = true,
  onPress,
}: {
  api: Api;
  item: BaseItemDto;
  width?: number;
  showCaption?: boolean;
  onPress?: (item: BaseItemDto) => void;
}) {
  const indicator = useFocusIndicator();
  const url = itemImageSource(api, item, ImageType.Primary, { maxWidth: imagePixelWidth(width) }).url;
  const title = displayTitle(item);
  const badge = watchedBadge(item);
  const imageSize = { width, height: width / theme.poster.aspectRatio };

  return (
    <Focusable
      onPress={() => onPress?.(item)}
      disabled={!onPress}
      style={({ pressed, focused }) => [
        { width },
        focused ? focusLift : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {({ focused }) => (
        <>
          <View style={[styles.image, imageSize, hoverTransition, focusGlow(indicator, focused)]}>
            <Text numberOfLines={3} style={styles.placeholderText}>
              {title}
            </Text>
            {url ? <Image source={{ uri: url }} style={styles.cover} resizeMode="cover" /> : null}
            {badge ? (
              <View style={styles.badge}>
                {badge === "played" ? (
                  <Icon name="checkmark" size={14} color={theme.colors.white} />
                ) : (
                  <Text style={styles.badgeText}>{badge}</Text>
                )}
              </View>
            ) : null}
            <FocusRing visible={focused} radius={theme.poster.radius} />
          </View>
          {showCaption ? (
            <Text numberOfLines={1} style={styles.caption}>
              {title}
            </Text>
          ) : null}
        </>
      )}
    </Focusable>
  );
}

const styles = StyleSheet.create({
  pressed: {
    opacity: 0.7,
  },
  image: {
    borderRadius: theme.poster.radius,
    overflow: "hidden",
    backgroundColor: theme.colors.placeholder,
    alignItems: "center",
    justifyContent: "center",
    padding: space(1),
  },
  // The image covers the placeholder title, which shows through only if the image is missing.
  cover: {
    ...StyleSheet.absoluteFill,
  },
  placeholderText: {
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    top: space(0.75),
    right: space(0.75),
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.accent,
  },
  badgeText: {
    color: theme.colors.white,
    fontSize: 12,
    fontWeight: "700",
  },
  caption: {
    color: theme.colors.text,
    fontSize: 13,
    marginTop: space(0.75),
  },
});
