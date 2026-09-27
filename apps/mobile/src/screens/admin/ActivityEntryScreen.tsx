//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { formatDateTime, useItem, useLoadedActivityEntry, useServerUser } from "@anemone/core";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { type BrowseParamList, useOpenItem } from "../../navigation/routes";
import { InfoSetting, LinkSetting, SettingsList, SettingsSection } from "../../ui/settings";
import { activityUserID } from "./ActivityScreen";

/**
 * One activity entry (Swiftfin `ServerActivityDetailsView`): what happened, to whom and to what.
 * Entries come from the list already loaded — the server can't fetch one alone — so a deep link
 * to an entry the app hasn't listed says so.
 */
export function ActivityEntryScreen({
  navigation,
  route,
}: NativeStackScreenProps<BrowseParamList, "AdminActivityEntry">) {
  const entry = useLoadedActivityEntry(route.params.entryID);

  if (!entry) {
    return (
      <SettingsList title="Activity" back>
        <SettingsSection footer="Open it from the activity list.">
          <InfoSetting label="This entry isn't loaded." />
        </SettingsSection>
      </SettingsList>
    );
  }

  const userID = activityUserID(entry);
  const overview = entry.Overview || entry.ShortOverview || undefined;
  return (
    <SettingsList title="Activity" back>
      <SettingsSection title="Overview">
        <InfoSetting label={entry.Name ?? "Activity"} description={overview} />
      </SettingsSection>
      {userID ? <UserLink userID={userID} onOpen={() => navigation.push("AdminUser", { userID })} /> : null}
      {entry.ItemId ? <ItemLink itemID={entry.ItemId} /> : null}
      <SettingsSection title="Details">
        <InfoSetting label="Level" value={entry.Severity} />
        <InfoSetting label="Type" value={entry.Type} />
        <InfoSetting label="Date" value={formatDateTime(entry.Date)} />
      </SettingsSection>
    </SettingsList>
  );
}

function UserLink({ userID, onOpen }: { userID: string; onOpen: () => void }) {
  const { data: user } = useServerUser(userID);
  return (
    <SettingsSection title="User">
      <LinkSetting
        label={user?.Name ?? "User"}
        icon={{ icon: "person-circle-outline", systemImage: "person.crop.circle" }}
        onPress={onOpen}
      />
    </SettingsSection>
  );
}

/** The item the entry is about, when it still exists — opens its page. */
function ItemLink({ itemID }: { itemID: string }) {
  const { data: item } = useItem(itemID);
  const openItem = useOpenItem();
  if (!item) {
    return null;
  }
  return (
    <SettingsSection title="Item">
      <LinkSetting
        label={item.Name ?? "Item"}
        icon={{ icon: "film-outline", systemImage: "film" }}
        onPress={() => openItem(item)}
      />
    </SettingsSection>
  );
}
