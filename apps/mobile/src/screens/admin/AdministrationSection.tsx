//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { useIsAdministrator } from "@anemone/core";
import { useBrowseNavigation } from "../../navigation/routes";
import { LinkSetting, SettingsSection } from "../../ui/settings";

/**
 * The Settings hub's links into server administration — shown only to administrators (the server
 * refuses these endpoints to everyone else anyway).
 */
export function AdministrationSection() {
  const navigation = useBrowseNavigation();
  if (!useIsAdministrator()) {
    return null;
  }
  return (
    <SettingsSection title="Administration">
      <LinkSetting
        label="Sessions"
        icon={{ icon: "play-circle-outline", systemImage: "play.circle" }}
        onPress={() => navigation.push("AdminSessions")}
      />
      <LinkSetting
        label="Activity"
        icon={{ icon: "pulse-outline", systemImage: "waveform.path.ecg" }}
        onPress={() => navigation.push("AdminActivity")}
      />
      <LinkSetting
        label="Devices"
        icon={{ icon: "phone-portrait-outline", systemImage: "iphone" }}
        onPress={() => navigation.push("AdminDevices")}
      />
      <LinkSetting
        label="Users"
        icon={{ icon: "people-outline", systemImage: "person.2" }}
        onPress={() => navigation.push("AdminUsers")}
      />
    </SettingsSection>
  );
}
