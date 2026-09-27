//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  type ActivityFilter,
  formatLastSeen,
  savedUserImageURL,
  useActivityLog,
  useCurrentSession,
} from "@anemone/core";
import type { ActivityLogEntry } from "@jellyfin/sdk/lib/generated-client/models/activity-log-entry";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import type { BrowseParamList } from "../../navigation/routes";
import { Avatar } from "../../ui/Avatar";
import type { IconName } from "../../ui/Icon";
import { imagePixelWidth } from "../../ui/imageSize";
import type { SettingOption } from "../../ui/settings";
import { theme } from "../../ui/theme";
import { AdminListPage } from "./AdminListPage";
import { AdminRow, ROW_LEADING_SIZE, RowIcon } from "./AdminRow";
import { AdminToolbar, FilterChips } from "./FilterChips";

const FILTER_OPTIONS: readonly SettingOption<ActivityFilter>[] = [
  { value: "all", label: "All" },
  { value: "users", label: "Users" },
  { value: "system", label: "System" },
];

/** A system event's icon by severity; problems stand out in the error colour. */
export function severityIcon(entry: ActivityLogEntry): { name: IconName; color: string } {
  switch (entry.Severity) {
    case "Error":
    case "Critical":
      return { name: "alert-circle-outline", color: theme.colors.error };
    case "Warning":
      return { name: "warning-outline", color: theme.colors.error };
    default:
      return { name: "server-outline", color: theme.colors.muted };
  }
}

/** The server's activity log, newest first (Swiftfin `ServerActivityView`), paging as it scrolls. */
export function ActivityScreen({ navigation }: NativeStackScreenProps<BrowseParamList, "AdminActivity">) {
  const { session } = useCurrentSession();
  const [filter, setFilter] = useState<ActivityFilter>("all");
  const query = useActivityLog(filter);
  const entries = query.data?.pages.flatMap((page) => page.Items ?? []);

  return (
    <AdminListPage
      title="Activity"
      toolbar={
        <AdminToolbar>
          <FilterChips options={FILTER_OPTIONS} value={filter} onChange={setFilter} />
        </AdminToolbar>
      }
      query={{ ...query, items: entries }}
      emptyText="No activity yet."
      keyExtractor={(entry, index) => String(entry.Id ?? index)}
      renderItem={(entry) => {
        const icon = severityIcon(entry);
        const userID = activityUserID(entry);
        const avatarURL =
          session && userID
            ? savedUserImageURL(session.server.currentURL, userID, entry.UserPrimaryImageTag ?? undefined, {
                maxWidth: imagePixelWidth(ROW_LEADING_SIZE),
              })
            : undefined;
        return (
          <AdminRow
            leading={
              userID ? (
                // User entries begin with the user's name ("dylan is playing …"): its initial.
                <Avatar name={entry.Name?.split(" ")[0]} imageURL={avatarURL} size={ROW_LEADING_SIZE} />
              ) : (
                <RowIcon name={icon.name} color={icon.color} />
              )
            }
            title={entry.Name ?? "Activity"}
            lines={[entry.ShortOverview ?? undefined, formatLastSeen(entry.Date)]}
            onPress={() => entry.Id != null && navigation.push("AdminActivityEntry", { entryID: entry.Id })}
          />
        );
      }}
    />
  );
}

/** The user an entry is about; system events carry the empty GUID instead. */
export function activityUserID(entry: ActivityLogEntry): string | undefined {
  return entry.UserId && /[1-9a-f]/i.test(entry.UserId) ? entry.UserId : undefined;
}
