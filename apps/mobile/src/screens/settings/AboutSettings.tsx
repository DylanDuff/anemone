//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { useCurrentSession, useServerInfo } from "@anemone/core";
import appConfig from "../../../app.json";
import { InfoSetting, SettingsList, SettingsSection } from "../../ui/settings";

/** This app's version, and which Jellyfin server (and version) it's talking to. */
export function AboutSettings() {
  const { session } = useCurrentSession();
  const serverInfo = useServerInfo();
  const serverVersion =
    serverInfo.data?.Version ?? (serverInfo.isError ? "Unavailable" : "Loading…");

  return (
    <SettingsList title="About" back>
      <SettingsSection title="App">
        <InfoSetting label="Version" value={appConfig.expo.version} />
      </SettingsSection>

      {session ? (
        <SettingsSection title="Server">
          <InfoSetting label="Name" value={serverInfo.data?.ServerName ?? session.server.name} />
          <InfoSetting label="Jellyfin version" value={serverVersion} />
          <InfoSetting label="Address" value={session.server.currentURL} />
        </SettingsSection>
      ) : null}
    </SettingsList>
  );
}
