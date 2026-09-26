//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { BackButton } from "../ui/BackButton";
import { Focusable, hoverTransition } from "../ui/Focusable";
import { GradientScrim } from "../ui/GradientScrim";
import { Icon, type IconName } from "../ui/Icon";
import { space, theme } from "../ui/theme";
import { SeekBar } from "./SeekBar";

/** How far the skip buttons jump, in seconds. */
export const SKIP_BACK_SECONDS = 10;
export const SKIP_FORWARD_SECONDS = 30;

/**
 * The overlay over the video: title at the top; seek bar and transport buttons at the bottom.
 * Kept mounted while hidden (faded out) so TV focus has somewhere to stay.
 */
export function PlayerControls({
  visible,
  title,
  subtitle,
  paused,
  position,
  duration,
  hasTracks,
  onTogglePause,
  onSeek,
  onSkip,
  onOpenTracks,
  onSeekBarFocusChange,
}: {
  visible: boolean;
  title: string | undefined;
  subtitle: string | undefined;
  paused: boolean;
  position: number;
  duration: number;
  hasTracks: boolean;
  onTogglePause: () => void;
  onSeek: (seconds: number) => void;
  onSkip: (seconds: number) => void;
  onOpenTracks: () => void;
  onSeekBarFocusChange: (focused: boolean) => void;
}) {
  const insets = useSafeAreaInsets();
  const padding = {
    paddingLeft: Math.max(insets.left, space(3)),
    paddingRight: Math.max(insets.right, space(3)),
  };

  return (
    <View
      pointerEvents={visible ? "box-none" : "none"}
      style={[StyleSheet.absoluteFill, hoverTransition, { opacity: visible ? 1 : 0 }]}
    >
      <GradientScrim color="#000000" from="top" endOpacity={0.7} style={styles.topScrim} />
      <GradientScrim color="#000000" endOpacity={0.85} style={styles.bottomScrim} />

      <View style={[styles.top, padding, { paddingTop: Math.max(insets.top, space(2)) }]}>
        <BackButton />
        <View style={styles.titles}>
          {title ? (
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
          ) : null}
          {subtitle ? (
            <Text numberOfLines={1} style={styles.subtitle}>
              {subtitle}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={[styles.bottom, padding, { paddingBottom: Math.max(insets.bottom, space(2)) }]}>
        <SeekBar
          position={position}
          duration={duration}
          onSeek={onSeek}
          onFocusChange={onSeekBarFocusChange}
        />
        <View style={styles.buttons}>
          <ControlButton
            icon="play-back"
            label={`Back ${SKIP_BACK_SECONDS} seconds`}
            onPress={() => onSkip(-SKIP_BACK_SECONDS)}
          />
          <ControlButton
            icon={paused ? "play" : "pause"}
            label={paused ? "Play" : "Pause"}
            large
            preferFocus
            onPress={onTogglePause}
          />
          <ControlButton
            icon="play-forward"
            label={`Forward ${SKIP_FORWARD_SECONDS} seconds`}
            onPress={() => onSkip(SKIP_FORWARD_SECONDS)}
          />
          <View style={styles.spacer} />
          {hasTracks ? (
            <ControlButton
              icon="chatbox-ellipses-outline"
              label="Audio and subtitles"
              onPress={onOpenTracks}
            />
          ) : null}
        </View>
      </View>
    </View>
  );
}

function ControlButton({
  icon,
  label,
  large = false,
  preferFocus = false,
  onPress,
}: {
  icon: IconName;
  label: string;
  large?: boolean;
  preferFocus?: boolean;
  onPress: () => void;
}) {
  const size = large ? 64 : 48;
  return (
    <Focusable
      accessibilityRole="button"
      accessibilityLabel={label}
      hasTVPreferredFocus={preferFocus}
      onPress={onPress}
      style={({ focused, pressed }) => [
        styles.button,
        { width: size, height: size, borderRadius: size / 2 },
        focused ? styles.buttonFocused : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {({ focused }) => (
        <Icon
          name={icon}
          size={large ? 32 : 24}
          color={focused ? theme.colors.chipActiveText : theme.colors.text}
        />
      )}
    </Focusable>
  );
}

const styles = StyleSheet.create({
  topScrim: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 160,
  },
  bottomScrim: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 220,
  },
  top: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
  },
  titles: {
    flex: 1,
    gap: space(0.25),
  },
  title: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: "600",
  },
  subtitle: {
    color: theme.colors.muted,
    fontSize: 14,
  },
  bottom: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    gap: space(1),
  },
  buttons: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
  },
  spacer: {
    flex: 1,
  },
  button: {
    alignItems: "center",
    justifyContent: "center",
  },
  buttonFocused: {
    backgroundColor: theme.colors.chipActive,
  },
  pressed: {
    opacity: 0.7,
  },
});
