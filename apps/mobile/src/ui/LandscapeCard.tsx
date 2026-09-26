//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

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
import { ProgressBar } from "./ProgressBar";
import { useCardWidths } from "./contentLayout";
import { space, theme } from "./theme";

/**
 * A 16:9 thumbnail card with an optional progress bar and up to three lines of text. Shared by
 * Continue Watching, episode lists, extras and additional parts.
 */
export function LandscapeCard({
  item,
  imageURL,
  title,
  subtitle,
  description,
  progress,
  width: widthOverride,
  onPress,
}: {
  item: BaseItemDto;
  imageURL: string | undefined;
  title: string;
  subtitle?: string;
  description?: string;
  /** Played fraction 0…1; the bar is hidden when absent or zero. */
  progress?: number;
  /** Defaults to the screen's card width (`useCardWidths`); size `imageURL` to match. */
  width?: number;
  onPress?: (item: BaseItemDto) => void;
}) {
  const cardWidths = useCardWidths();
  const width = widthOverride ?? cardWidths.landscapeCard;
  const height = Math.round((width * 9) / 16);
  const indicator = useFocusIndicator();

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
          <View
            style={[styles.thumb, { width, height }, hoverTransition, focusGlow(indicator, focused)]}
          >
            {imageURL ? (
              <Image source={{ uri: imageURL }} style={{ width, height }} resizeMode="cover" />
            ) : null}
            {progress ? <ProgressBar fraction={progress} style={styles.progress} /> : null}
            <FocusRing visible={focused} radius={theme.poster.radius} />
          </View>
          <Text numberOfLines={1} style={styles.title}>
            {title}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
          {description ? (
            <Text numberOfLines={3} style={styles.description}>
              {description}
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
  thumb: {
    borderRadius: theme.poster.radius,
    overflow: "hidden",
    backgroundColor: theme.colors.placeholder,
  },
  progress: {
    position: "absolute",
    left: 8,
    right: 8,
    bottom: 4,
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
  description: {
    color: theme.colors.muted,
    fontSize: 12,
    lineHeight: 17,
    marginTop: space(0.5),
  },
});
