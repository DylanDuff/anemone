//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { describeError, useCurrentSession } from "@anemone/core";
import { ActionSetting, InfoSetting, SettingsList, SettingsSection } from "../../ui/settings";

/**
 * A detail page before its record arrives: loading, or why it failed with Try Again — as settings
 * rows, so it looks at home in the native form the page will become.
 */
export function DetailPlaceholder({
  title,
  error,
  onRetry,
}: {
  title: string;
  error: unknown;
  onRetry: () => void;
}) {
  const { session } = useCurrentSession();
  if (!error) {
    return (
      <SettingsList title={title} back>
        <SettingsSection>
          <InfoSetting label="Loading…" />
        </SettingsSection>
      </SettingsList>
    );
  }
  const { title: problem, message } = describeError(error, session?.server.name);
  return (
    <SettingsList title={title} back>
      <SettingsSection>
        <InfoSetting label={problem} description={message} />
        <ActionSetting label="Try Again" preferFocus onPress={onRetry} />
      </SettingsSection>
    </SettingsList>
  );
}
