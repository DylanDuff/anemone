//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { describeError, useCreateServerUser } from "@anemone/core";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import type { BrowseParamList } from "../../navigation/routes";
import { ActionSetting, SettingsList, SettingsSection, TextSetting } from "../../ui/settings";

/**
 * Create an account (Swiftfin `AddServerUserView`): a name and an optional password. It opens the
 * new user's page, where permissions can be set.
 */
export function AddUserScreen({ navigation }: NativeStackScreenProps<BrowseParamList, "AdminAddUser">) {
  const create = useCreateServerUser();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const mismatch = password !== confirmation;

  const footer = create.isError
    ? describeError(create.error).message
    : mismatch && confirmation !== ""
      ? "The passwords don't match."
      : "The password is optional.";

  const submit = () =>
    create.mutate(
      { name, password },
      {
        onSuccess: (user) => {
          if (user.Id) {
            navigation.replace("AdminUser", { userID: user.Id });
          }
        },
      },
    );

  return (
    <SettingsList title="Add User" back>
      <SettingsSection title="Username">
        <TextSetting label="Username" onChangeText={setName} autoCapitalize="none" />
      </SettingsSection>
      <SettingsSection title="Password" footer={footer}>
        <TextSetting label="Password" onChangeText={setPassword} secureTextEntry autoCapitalize="none" />
        <TextSetting
          label="Confirm password"
          onChangeText={setConfirmation}
          secureTextEntry
          autoCapitalize="none"
        />
      </SettingsSection>
      <SettingsSection>
        <ActionSetting
          label="Create User"
          busy={create.isPending}
          disabled={name.trim() === "" || mismatch}
          onPress={submit}
        />
      </SettingsSection>
    </SettingsList>
  );
}
