//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { useState } from "react";
import { ActionSetting, SettingsSection } from "../../ui/settings";

/**
 * A destructive action that asks first, inline: the row becomes Confirm + Cancel with the
 * consequence underneath (no alert dialogs — none on web, awkward on TV; TV focus jumps to the
 * confirm row). `unavailable` explains why it can't be done instead (e.g. this device).
 */
export function DeleteSection({
  label,
  prompt,
  busy,
  unavailable,
  onConfirm,
}: {
  label: string;
  prompt: string;
  busy: boolean;
  unavailable?: string;
  onConfirm: () => void;
}) {
  const [confirming, setConfirming] = useState(false);

  if (unavailable) {
    return (
      <SettingsSection footer={unavailable}>
        <ActionSetting label={label} destructive disabled onPress={onConfirm} />
      </SettingsSection>
    );
  }
  return (
    <SettingsSection footer={confirming ? prompt : undefined}>
      {confirming ? (
        <>
          <ActionSetting label={label} destructive busy={busy} preferFocus onPress={onConfirm} />
          <ActionSetting label="Cancel" onPress={() => setConfirming(false)} />
        </>
      ) : (
        <ActionSetting label={label} destructive onPress={() => setConfirming(true)} />
      )}
    </SettingsSection>
  );
}
