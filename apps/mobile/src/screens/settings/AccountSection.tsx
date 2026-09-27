//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { useCurrentSession, useSessionController } from "@anemone/core";
import { useState } from "react";
import { ActionSetting, InfoSetting, SettingsSection } from "../../ui/settings";

/**
 * Who's signed in, to which server. Switch User returns to the user picker, keeping this account;
 * Sign Out also removes it from this device, so it asks first — inline (no alert dialogs: they
 * don't exist on web and are awkward on TV); on TV focus jumps to the confirm row.
 */
export function AccountSection() {
  const { session } = useCurrentSession();
  const sessionController = useSessionController();
  const [confirming, setConfirming] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  if (!session) {
    return null;
  }
  const { user, server } = session;

  // Switch User keeps this account saved (one tap back from the picker); Sign Out forgets it.
  const switchUser = () => void sessionController.signOut();
  const signOut = () => {
    setSigningOut(true);
    void sessionController.signOutAndForget();
  };

  return (
    <SettingsSection
      title="Account"
      footer={confirming ? `Sign out and remove ${user.username} from this device?` : undefined}
    >
      <InfoSetting label={user.username} description={`${server.name} · ${server.currentURL}`} />
      {confirming ? (
        <>
          <ActionSetting
            label="Sign Out"
            destructive
            busy={signingOut}
            preferFocus
            onPress={signOut}
          />
          <ActionSetting label="Cancel" onPress={() => setConfirming(false)} />
        </>
      ) : (
        <>
          <ActionSetting label="Switch User" onPress={switchUser} />
          <ActionSetting label="Sign Out" destructive onPress={() => setConfirming(true)} />
        </>
      )}
    </SettingsSection>
  );
}
