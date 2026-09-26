//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { useCurrentSession, useSessionController } from "@anemone/core";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "../../ui/Button";
import { space, theme } from "../../ui/theme";

/**
 * Who's signed in, to which server. Switch User returns to the user picker, keeping this account;
 * Sign Out also removes it from this device, so it asks first — inline (no alert dialogs: they
 * don't exist on web and are awkward on TV); on TV focus jumps to the confirm button.
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
    <View style={styles.row}>
      <View style={styles.text}>
        <Text style={styles.label}>{user.username}</Text>
        <Text style={styles.description}>
          {server.name} · {server.currentURL}
        </Text>
      </View>
      {confirming ? (
        <View style={styles.actions}>
          <Text style={styles.prompt}>Sign out and remove {user.username} from this device?</Text>
          <Button
            label="Sign Out"
            variant="destructive"
            busy={signingOut}
            preferFocus
            onPress={signOut}
          />
          <Button label="Cancel" variant="plain" onPress={() => setConfirming(false)} />
        </View>
      ) : (
        <View style={styles.actions}>
          <Button label="Switch User" variant="secondary" icon="people-outline" onPress={switchUser} />
          <Button
            label="Sign Out"
            variant="destructive"
            icon="log-out-outline"
            onPress={() => setConfirming(true)}
          />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space(3),
    paddingVertical: space(2),
    paddingHorizontal: space(2.5),
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
  },
  text: {
    flex: 1,
    minWidth: 220,
    gap: space(0.5),
  },
  label: {
    ...theme.type.label,
    color: theme.colors.text,
  },
  description: {
    ...theme.type.caption,
    color: theme.colors.muted,
  },
  actions: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: space(1),
  },
  prompt: {
    ...theme.type.callout,
    color: theme.colors.text,
    marginRight: space(1),
  },
});
