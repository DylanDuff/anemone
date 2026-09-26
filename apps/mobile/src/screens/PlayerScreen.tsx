//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { displayTitle, seasonEpisodeLabel, useItem } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useQuery } from "@tanstack/react-query";
import { StatusBar } from "expo-status-bar";
import { ActivityIndicator, StyleSheet, View } from "react-native";
import type { RootStackParamList } from "../navigation/routes";
import { detectCapabilities } from "../player/capabilities";
import { Player } from "../player/Player";
import { theme } from "../ui/theme";

/** "Series · S1 E2" for an episode; nothing extra for a movie. */
function playerSubtitle(item: BaseItemDto | undefined): string | undefined {
  if (!item?.SeriesName) {
    return undefined;
  }
  const locator = seasonEpisodeLabel(item);
  return locator ? `${item.SeriesName} · ${locator}` : item.SeriesName;
}

/** Full-screen playback of one item (Swiftfin `VideoPlayer`). */
export function PlayerScreen({ route }: NativeStackScreenProps<RootStackParamList, "Player">) {
  const { itemID, mediaSourceID, startTicks } = route.params;
  const { data: item } = useItem(itemID);
  const { data: capabilities } = useQuery({
    queryKey: ["playerCapabilities"],
    queryFn: detectCapabilities,
    staleTime: Infinity,
  });

  return (
    <View style={styles.container}>
      <StatusBar hidden />
      {capabilities ? (
        <Player
          itemID={itemID}
          mediaSourceID={mediaSourceID}
          startTicks={startTicks}
          capabilities={capabilities}
          title={item ? displayTitle(item) : undefined}
          subtitle={playerSubtitle(item)}
        />
      ) : (
        <ActivityIndicator style={styles.loading} size="large" color={theme.colors.white} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loading: {
    flex: 1,
  },
});
