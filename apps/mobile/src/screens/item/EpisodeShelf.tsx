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
import { useCardWidths } from "../../ui/contentLayout";
import { LandscapeCard } from "../../ui/LandscapeCard";
import { Shelf } from "../../ui/Shelf";
import { space, theme } from "../../ui/theme";
import { imagePixelWidth } from "../../ui/imageSize";

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
  const cardWidth = useCardWidths().episodeCard;
  // Loading / empty states hold the row's height so the page doesn't jump.
  const statusHeight = (cardWidth * 9) / 16;
  return (
    <Shelf title={title} accessory={header}>
      {isLoading ? (
        <ActivityIndicator color={theme.colors.accent} style={[styles.status, { height: statusHeight }]} />
      ) : episodes.length === 0 ? (
        <Text style={[styles.status, styles.empty, { height: statusHeight }]}>No episodes.</Text>
      ) : (
        episodes.map((episode, index) => (
          <LandscapeCard
            key={episode.Id ?? index}
            item={episode}
            width={cardWidth}
            imageURL={
              itemImageSource(api, episode, ImageType.Primary, { maxWidth: imagePixelWidth(cardWidth) }).url
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
    marginLeft: space(2),
  },
  empty: {
    ...theme.type.callout,
    color: theme.colors.muted,
  },
});
