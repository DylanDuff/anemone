//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  type Api,
  displayTitle,
  useEpisodes,
  useSeasons,
  useSeriesPlayTarget,
} from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { useState } from "react";
import { ScrollView, StyleSheet } from "react-native";
import { Chip } from "../../ui/Chip";
import { ChoiceMenu } from "../../ui/ChoiceMenu";
import type { MenuChoice } from "../../ui/choiceMenuTypes";
import { useIsCompact } from "../../ui/contentLayout";
import { liftRoom } from "../../ui/Focusable";
import { space } from "../../ui/theme";
import { EpisodeShelf } from "./EpisodeShelf";

/**
 * A series' season picker and the selected season's episodes (Swiftfin `EpisodeSelector`). Opens
 * on the season containing the Play button's episode, else the first season. Like the library
 * toolbar, the seasons are glass chips under the title, or on phones one glass chip at the end
 * of the title's line that opens the platform's menu of them.
 */
export function SeasonsSection({
  api,
  series,
  onPressEpisode,
}: {
  api: Api;
  series: BaseItemDto & { Id: string };
  onPressEpisode: (episode: BaseItemDto) => void;
}) {
  const { data: seasons = [] } = useSeasons(series.Id);
  const { data: playTarget } = useSeriesPlayTarget(series.Id);
  const [chosenSeasonID, setChosenSeasonID] = useState<string>();
  const compact = useIsCompact();

  const selectedSeasonID =
    chosenSeasonID ?? playTarget?.SeasonId ?? seasons[0]?.Id ?? undefined;
  const { data: episodes = [], isLoading } = useEpisodes(series.Id, selectedSeasonID);

  if (seasons.length === 0) {
    return null;
  }

  const choosable = seasons.length > 1;
  const choices = seasons.flatMap((season): MenuChoice<string>[] =>
    season.Id ? [{ value: season.Id, label: displayTitle(season), ...SEASON_ICON }] : [],
  );

  const menu =
    choosable && compact && selectedSeasonID ? (
      <ChoiceMenu
        glass
        choices={choices}
        value={selectedSeasonID}
        onChange={setChosenSeasonID}
        accessibilityLabel="Season"
      />
    ) : undefined;

  const chips =
    choosable && !compact ? (
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.pickerFrame}
        contentContainerStyle={styles.picker}
      >
        {seasons.map((season, index) => (
          <Chip
            glass
            key={season.Id ?? index}
            label={displayTitle(season)}
            selected={season.Id === selectedSeasonID}
            onPress={() => setChosenSeasonID(season.Id ?? undefined)}
          />
        ))}
      </ScrollView>
    ) : undefined;

  return (
    <EpisodeShelf
      api={api}
      title="Episodes"
      header={chips}
      trailing={menu}
      episodes={episodes}
      isLoading={isLoading}
      onPressEpisode={onPressEpisode}
    />
  );
}

/** A season opened directly: just its episodes. */
export function SeasonEpisodes({
  api,
  season,
  onPressEpisode,
}: {
  api: Api;
  season: BaseItemDto & { Id: string; SeriesId: string };
  onPressEpisode: (episode: BaseItemDto) => void;
}) {
  const { data: episodes = [], isLoading } = useEpisodes(season.SeriesId, season.Id);
  return (
    <EpisodeShelf
      api={api}
      title="Episodes"
      episodes={episodes}
      isLoading={isLoading}
      onPressEpisode={onPressEpisode}
    />
  );
}

/** The season menu's icon (Ionicons, and the SF Symbol for the native iOS menu). */
const SEASON_ICON = { icon: "albums-outline", systemImage: "square.stack" } as const;

/** Room for a focused chip's lift inside the clipping picker; covers chips up to 160pt wide. */
const PICKER_ROOM = liftRoom(160);

const styles = StyleSheet.create({
  // Extend the clip past the chips by the lift's reach, without moving them.
  pickerFrame: {
    margin: -PICKER_ROOM,
  },
  picker: {
    gap: space(1),
    padding: PICKER_ROOM,
  },
});
