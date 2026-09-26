//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  isFavorite,
  isPlayed,
  playButtonLabel,
  playedFraction,
  progressLabel,
  useSeriesPlayTarget,
  useSetItemFavorite,
  useSetItemPlayed,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { useGlassButtons } from "../settings";
import { Focusable, focusLift } from "./Focusable";
import { GlassFill, glassFillHost } from "./Glass";
import { Icon, type IconName } from "./Icon";
import { ProgressBar } from "./ProgressBar";
import { isTV } from "./tv";
import { space, theme } from "./theme";

/**
 * Play (or Resume) plus played/favorite toggles (Swiftfin `ActionButtonHStack`). `preferFocus`
 * gives the first action initial D-pad focus on TV.
 */
export function ItemActions({
  item,
  preferFocus = false,
  onOpenDetails,
}: {
  item: BaseItemDto;
  preferFocus?: boolean;
  /** Adds an ⓘ button that opens the item page (the home hero; its artwork isn't interactive). */
  onOpenDetails?: () => void;
}) {
  const hasPlay = item.Type !== BaseItemKind.BoxSet;
  return (
    <View style={styles.row}>
      {item.Type === BaseItemKind.Series && item.Id ? (
        <SeriesPlayButton seriesID={item.Id} preferFocus={preferFocus} />
      ) : hasPlay ? (
        <PlayButton target={item} preferFocus={preferFocus} />
      ) : null}
      <UserDataToggles item={item} preferFocus={preferFocus && !hasPlay} />
      {onOpenDetails ? (
        <RoundToggle
          icon="information-circle-outline"
          label="More info"
          active={false}
          busy={false}
          onPress={onOpenDetails}
        />
      ) : null}
    </View>
  );
}

/** A series plays its next-up / in-progress / first episode. */
function SeriesPlayButton({ seriesID, preferFocus }: { seriesID: string; preferFocus: boolean }) {
  const { data: target } = useSeriesPlayTarget(seriesID);
  return target ? <PlayButton target={target} preferFocus={preferFocus} /> : null;
}

/**
 * Starts `target`. Playback is not built yet (see docs/BACKLOG.md), so pressing it explains that
 * rather than silently doing nothing.
 */
function PlayButton({ target, preferFocus }: { target: BaseItemDto; preferFocus: boolean }) {
  const [notice, setNotice] = useState(false);
  const glass = useGlassButtons();
  const fraction = playedFraction(target) ?? 0;
  const remaining = fraction > 0 ? progressLabel(target) : undefined;

  return (
    <View style={styles.play}>
      <Focusable
        onPress={() => setNotice(true)}
        accessibilityRole="button"
        hasTVPreferredFocus={preferFocus}
        style={({ pressed, focused }) => [
          styles.playButton,
          // On TV the button is only solid while focused, so focus is always visible.
          isTV && !focused ? (glass ? glassFillHost : styles.playButtonResting) : null,
          focused ? focusLift : null,
          pressed ? styles.pressed : null,
        ]}
      >
        {({ focused }) => {
          const resting = isTV && !focused;
          return (
            <>
              {resting && glass ? <GlassFill radius={ROUND_SIZE / 2} /> : null}
              <Icon
                name="play"
                size={18}
                color={resting ? theme.colors.text : theme.colors.chipActiveText}
              />
              <Text style={[styles.playLabel, resting ? styles.playLabelResting : null]}>
                {playButtonLabel(target)}
              </Text>
            </>
          );
        }}
      </Focusable>
      {remaining ? (
        <View style={styles.progress}>
          <ProgressBar fraction={fraction} style={styles.progressBar} />
          <Text style={styles.remaining}>{remaining} left</Text>
        </View>
      ) : null}
      {notice ? <Text style={styles.notice}>Playback isn't available yet.</Text> : null}
    </View>
  );
}

function UserDataToggles({ item, preferFocus }: { item: BaseItemDto; preferFocus: boolean }) {
  const setPlayed = useSetItemPlayed();
  const setFavorite = useSetItemFavorite();
  const itemID = item.Id;
  if (!itemID) {
    return null;
  }
  const played = isPlayed(item);
  const favorite = isFavorite(item);

  return (
    <>
      <RoundToggle
        icon={played ? "checkmark-circle" : "checkmark-circle-outline"}
        label={played ? "Mark unplayed" : "Mark played"}
        active={played}
        preferFocus={preferFocus}
        busy={setPlayed.isPending}
        onPress={() => setPlayed.mutate({ itemID, enabled: !played })}
      />
      <RoundToggle
        icon={favorite ? "heart" : "heart-outline"}
        label={favorite ? "Remove favorite" : "Add favorite"}
        active={favorite}
        activeColor={theme.colors.favorite}
        busy={setFavorite.isPending}
        onPress={() => setFavorite.mutate({ itemID, enabled: !favorite })}
      />
    </>
  );
}

function RoundToggle({
  icon,
  label,
  active,
  activeColor = theme.colors.accent,
  preferFocus = false,
  busy,
  onPress,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  activeColor?: string;
  preferFocus?: boolean;
  busy: boolean;
  onPress: () => void;
}) {
  const glass = useGlassButtons();
  return (
    <Focusable
      // Not `disabled` while busy: a disabled view drops D-pad focus on TV. Ignore presses instead.
      onPress={() => {
        if (!busy) {
          onPress();
        }
      }}
      hasTVPreferredFocus={preferFocus}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected: active, busy }}
      style={({ pressed, focused }) => [
        styles.round,
        glass && !focused ? glassFillHost : null,
        focused ? [styles.roundFocused, focusLift] : null,
        pressed || busy ? styles.pressed : null,
      ]}
    >
      {({ focused }) => (
        <>
          {glass && !focused ? <GlassFill radius={ROUND_SIZE / 2} /> : null}
          <Icon
            name={icon}
            size={24}
            color={
              active ? activeColor : focused ? theme.colors.chipActiveText : theme.colors.text
            }
          />
        </>
      )}
    </Focusable>
  );
}

const ROUND_SIZE = 48;

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: space(1.5),
    marginTop: space(1),
  },
  play: {
    gap: space(1),
  },
  playButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(1),
    height: ROUND_SIZE,
    paddingHorizontal: space(3.5),
    borderRadius: ROUND_SIZE / 2,
    justifyContent: "center",
    backgroundColor: theme.colors.white,
  },
  playButtonResting: {
    backgroundColor: theme.colors.chip,
  },
  playLabel: {
    color: theme.colors.chipActiveText,
    fontSize: 16,
    fontWeight: "700",
  },
  playLabelResting: {
    color: theme.colors.text,
  },
  progress: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(1),
  },
  progressBar: {
    width: 120,
  },
  remaining: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  notice: {
    color: theme.colors.muted,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.6,
  },
  round: {
    width: ROUND_SIZE,
    height: ROUND_SIZE,
    borderRadius: ROUND_SIZE / 2,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.chip,
  },
  roundFocused: {
    backgroundColor: theme.colors.chipActive,
  },
});
