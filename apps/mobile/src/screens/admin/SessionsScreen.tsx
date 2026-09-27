//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  type Api,
  formatLastSeen,
  playMethodTitle,
  type SessionFilter,
  sessionProgress,
  useActiveSessions,
  useQueryContext,
} from "@anemone/core";
import type { SessionInfoDto } from "@jellyfin/sdk/lib/generated-client/models/session-info-dto";
import { useIsFocused } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import type { BrowseParamList } from "../../navigation/routes";
import { ProgressBar } from "../../ui/ProgressBar";
import type { SettingOption } from "../../ui/settings";
import { space, theme } from "../../ui/theme";
import { AdminListPage, listQuery } from "./AdminListPage";
import { AdminRow, type RowBadge, RowIcon, RowPoster } from "./AdminRow";
import {
  deviceIcon,
  nowPlayingLabels,
  nowPlayingPosterURL,
  progressClock,
} from "./adminFormat";
import { AdminToolbar, FilterChips } from "./FilterChips";

const FILTER_OPTIONS: readonly SettingOption<SessionFilter>[] = [
  { value: "all", label: "All" },
  { value: "playing", label: "Playing" },
  { value: "idle", label: "Idle" },
];

type ActiveWindow = "15m" | "1h" | "1d" | "1w";

const WINDOW_OPTIONS: readonly SettingOption<ActiveWindow>[] = [
  { value: "15m", label: "15 min" },
  { value: "1h", label: "1 hour" },
  { value: "1d", label: "1 day" },
  { value: "1w", label: "1 week" },
];

const WINDOW_SECONDS: Record<ActiveWindow, number> = {
  "15m": 15 * 60,
  "1h": 60 * 60,
  "1d": 24 * 60 * 60,
  "1w": 7 * 24 * 60 * 60,
};

/**
 * Who's connected and what they're watching (Swiftfin `ActiveSessionsView`): playing sessions
 * first, refreshed every few seconds while the page is on screen.
 */
export function SessionsScreen({ navigation }: NativeStackScreenProps<BrowseParamList, "AdminSessions">) {
  const { api } = useQueryContext();
  const [filter, setFilter] = useState<SessionFilter>("all");
  const [activeWindow, setActiveWindow] = useState<ActiveWindow>("15m");
  const query = useActiveSessions({
    activeWithinSeconds: WINDOW_SECONDS[activeWindow],
    filter,
    live: useIsFocused(),
  });

  return (
    <AdminListPage
      title="Sessions"
      toolbar={
        <AdminToolbar>
          <FilterChips options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
          <FilterChips options={WINDOW_OPTIONS} value={activeWindow} onChange={setActiveWindow} />
        </AdminToolbar>
      }
      query={listQuery(query)}
      emptyText="No sessions in this time."
      keyExtractor={(session, index) => session.Id ?? String(index)}
      renderItem={(session) => (
        <SessionRow
          api={api}
          session={session}
          onPress={() => session.Id && navigation.push("AdminSession", { sessionID: session.Id })}
        />
      )}
    />
  );
}

function SessionRow({
  api,
  session,
  onPress,
}: {
  api: Api;
  session: SessionInfoDto;
  onPress: () => void;
}) {
  const item = session.NowPlayingItem;
  const progress = sessionProgress(session);
  const device = [session.Client, session.DeviceName].filter(Boolean).join(" · ");
  const method = playMethodTitle(session);
  const badges: RowBadge[] = [
    ...(method ? [{ label: method, tone: method === "Transcode" ? "accent" : "muted" } as const] : []),
    ...(progress?.isPaused ? [{ label: "Paused" }] : []),
  ];

  if (item && progress) {
    const labels = nowPlayingLabels(item);
    return (
      <AdminRow
        leading={<RowPoster url={nowPlayingPosterURL(api, item)} />}
        title={session.UserName ?? "Unknown user"}
        badges={badges}
        lines={[labels.title, labels.detail, device]}
        onPress={onPress}
      >
        <View style={styles.progress}>
          <ProgressBar fraction={progress.fraction} style={styles.bar} />
          <Text style={styles.clock}>{progressClock(progress)}</Text>
        </View>
      </AdminRow>
    );
  }

  return (
    <AdminRow
      leading={<RowIcon name={deviceIcon(session.Client, session.DeviceName)} />}
      title={session.UserName ?? "Unknown user"}
      lines={[device, formatLastSeen(session.LastActivityDate)]}
      onPress={onPress}
    />
  );
}

const styles = StyleSheet.create({
  progress: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(1),
    marginTop: space(0.5),
  },
  bar: {
    flex: 1,
  },
  clock: {
    ...theme.type.footnote,
    color: theme.colors.muted,
    fontVariant: ["tabular-nums"],
  },
});
