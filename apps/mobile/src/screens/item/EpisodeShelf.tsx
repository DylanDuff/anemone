//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  type Api,
  displayTitle,
  episodeLocator,
  ImageType,
  itemImageSource,
  playedFraction,
  runtimeLabel,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import type { ReactNode } from "react";
import { ActivityIndicator, StyleSheet, Text } from "react-native";
import { LandscapeCard } from "../../ui/LandscapeCard";
import { Shelf } from "../../ui/Shelf";
import { space, theme } from "../../ui/theme";
import { imagePixelWidth } from "../../ui/imageSize";

const CARD_WIDTH = 320;

/**
 * A horizontal row of episode cards (Swiftfin `EpisodeHStack`) with loading/empty states. `header`
 * sits between the title and the cards — the season picker on a series page.
 */
export function EpisodeShelf({
  api,
  title,
  episodes,
  isLoading,
  header,
  onPressEpisode,
}: {
  api: Api;
  title: string;
  episodes: readonly BaseItemDto[];
  isLoading: boolean;
  header?: ReactNode;
  onPressEpisode: (episode: BaseItemDto) => void;
}) {
  return (
    <Shelf title={title} accessory={header}>
      {isLoading ? (
        <ActivityIndicator color={theme.colors.accent} style={styles.status} />
      ) : episodes.length === 0 ? (
        <Text style={[styles.status, styles.empty]}>No episodes.</Text>
      ) : (
        episodes.map((episode, index) => (
          <LandscapeCard
            key={episode.Id ?? index}
            item={episode}
            width={CARD_WIDTH}
            imageURL={
              itemImageSource(api, episode, ImageType.Primary, { maxWidth: imagePixelWidth(CARD_WIDTH) }).url
            }
            title={[episodeLocator(episode), displayTitle(episode)].filter(Boolean).join(" · ")}
            subtitle={runtimeLabel(episode)}
            description={episode.Overview ?? undefined}
            progress={playedFraction(episode)}
            onPress={onPressEpisode}
          />
        ))
      )}
    </Shelf>
  );
}

const styles = StyleSheet.create({
  status: {
    height: (CARD_WIDTH * 9) / 16,
    marginLeft: space(2),
  },
  empty: {
    color: theme.colors.muted,
    fontSize: 14,
  },
});
