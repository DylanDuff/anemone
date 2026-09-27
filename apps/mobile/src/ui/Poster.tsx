//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type Api, displayTitle, ImageType, isPlayed, itemImageSource } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { StyleSheet, Text, View } from "react-native";
import { Artwork } from "./Artwork";
import {
  Focusable,
  focusGlow,
  focusLift,
  FocusRing,
  hoverTransition,
  useFocusIndicator,
} from "./Focusable";
import { Icon } from "./Icon";
import { useCardWidths } from "./contentLayout";
import { space, theme } from "./theme";
import { imagePixelWidth } from "./imageSize";
import { useAccent } from "../settings";

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
  width: widthOverride,
  showCaption = true,
  onPress,
}: {
  api: Api;
  item: BaseItemDto;
  /** Defaults to the screen's poster width (`useCardWidths`). */
  width?: number;
  showCaption?: boolean;
  onPress?: (item: BaseItemDto) => void;
}) {
  const cardWidths = useCardWidths();
  const width = widthOverride ?? cardWidths.poster;
  const indicator = useFocusIndicator();
  const image = itemImageSource(api, item, ImageType.Primary, { maxWidth: imagePixelWidth(width) });
  const title = displayTitle(item);
  const badge = watchedBadge(item);
  const accent = useAccent();
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
            {image.url ? (
              <Artwork uri={image.url} blurHash={image.blurHash} style={styles.cover} />
            ) : null}
            {badge ? (
              <View style={[styles.badge, { backgroundColor: accent.color }]}>
                {badge === "played" ? (
                  <Icon name="checkmark" size={14} color={accent.onColor} />
                ) : (
                  <Text style={[styles.badgeText, { color: accent.onColor }]}>{badge}</Text>
                )}
              </View>
            ) : null}
            <FocusRing visible={focused} radius={theme.radii.md} />
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
    borderRadius: theme.radii.md,
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
    ...theme.type.footnote,
    color: theme.colors.muted,
    textAlign: "center",
  },
  badge: {
    position: "absolute",
    top: space(0.75),
    right: space(0.75),
    minWidth: 22,
    height: 22,
    paddingHorizontal: 6,
    borderRadius: theme.radii.pill,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: {
    ...theme.type.footnote,
    color: theme.colors.white,
    fontWeight: theme.weight.bold,
  },
  caption: {
    ...theme.type.caption,
    color: theme.colors.text,
    marginTop: space(0.75),
  },
});
