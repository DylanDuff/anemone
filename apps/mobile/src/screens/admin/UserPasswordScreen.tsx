//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { useServerUser, useSetServerUserPassword } from "@anemone/core";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import type { BrowseParamList } from "../../navigation/routes";
import { ActionSetting, SettingsList, SettingsSection, TextSetting } from "../../ui/settings";

/**
 * Set a user's password as an administrator (Swiftfin `ResetUserPasswordView`): no current
 * password needed. Leaving both fields empty removes the password.
 */
export function UserPasswordScreen({
  navigation,
  route,
}: NativeStackScreenProps<BrowseParamList, "AdminUserPassword">) {
  const { userID } = route.params;
  const { data: user } = useServerUser(userID);
  const save = useSetServerUserPassword();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const mismatch = password !== confirmation;

  const footer = save.isError
    ? "Couldn't set the password. Try again."
    : mismatch && confirmation !== ""
      ? "The passwords don't match."
      : `Leave both empty to let ${user?.Name ?? "this user"} sign in without a password.`;

  return (
    <SettingsList title="Password" back>
      <SettingsSection title="New password" footer={footer}>
        <TextSetting label="Password" onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
        <TextSetting
          label="Confirm password"
          onChangeText={setConfirmation}
          secureTextEntry
          autoCapitalize="none"
        />
        <ActionSetting
          label={password === "" ? "Remove Password" : "Set Password"}
          destructive={password === ""}
          busy={save.isPending}
          disabled={mismatch}
          onPress={() => save.mutate({ userID, password }, { onSuccess: () => navigation.goBack() })}
        />
      </SettingsSection>
    </SettingsList>
  );
}
