//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  useDeleteServerUser,
  useQueryContext,
  useRenameServerUser,
  useServerUser,
} from "@anemone/core";
import type { UserDto } from "@jellyfin/sdk/lib/generated-client/models/user-dto";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import type { BrowseParamList } from "../../navigation/routes";
import {
  ActionSetting,
  InfoSetting,
  LinkSetting,
  SettingsList,
  SettingsSection,
  TextSetting,
} from "../../ui/settings";
import { DeleteSection } from "./DeleteSection";
import { DetailPlaceholder } from "./DetailPlaceholder";
import { userActivity, userBadges } from "./UsersScreen";

type Props = NativeStackScreenProps<BrowseParamList, "AdminUser">;

/**
 * One user's account (Swiftfin `ServerUserDetailsView`): rename, permissions, password, delete.
 * You can't delete your own account from here.
 */
export function UserScreen({ navigation, route }: Props) {
  const { data: user, error, refetch } = useServerUser(route.params.userID);
  if (!user) {
    return <DetailPlaceholder title="User" error={error} onRetry={() => void refetch()} />;
  }
  return <UserDetails user={user} navigation={navigation} />;
}

function UserDetails({ user, navigation }: { user: UserDto; navigation: Props["navigation"] }) {
  const ctx = useQueryContext();
  const rename = useRenameServerUser();
  const remove = useDeleteServerUser();
  const [name, setName] = useState(user.Name ?? "");
  const userID = user.Id ?? "";
  const status = userBadges(user)
    .map((badge) => badge.label)
    .join(", ");

  return (
    <SettingsList title={user.Name ?? "User"} back>
      <SettingsSection>
        <InfoSetting label={userActivity(user)} value={status || undefined} />
      </SettingsSection>

      <SettingsSection
        title="Username"
        footer={rename.isError ? "Couldn't rename this user. The name may be taken." : undefined}
      >
        <TextSetting
          label="Username"
          defaultValue={user.Name ?? ""}
          onChangeText={setName}
          autoCapitalize="none"
        />
        <ActionSetting
          label="Save"
          busy={rename.isPending}
          disabled={name.trim() === "" || name.trim() === user.Name}
          onPress={() => rename.mutate({ user, name })}
        />
      </SettingsSection>

      <SettingsSection title="Account">
        <LinkSetting
          label="Permissions"
          icon={{ icon: "key-outline", systemImage: "key" }}
          onPress={() => navigation.push("AdminUserPermissions", { userID })}
        />
        <LinkSetting
          label="Password"
          icon={{ icon: "lock-closed-outline", systemImage: "lock" }}
          detail={user.HasPassword === false ? "None" : undefined}
          onPress={() => navigation.push("AdminUserPassword", { userID })}
        />
      </SettingsSection>

      <DeleteSection
        label="Delete User"
        prompt={`Delete ${user.Name ?? "this user"} from the server? Their watch history and settings go too.`}
        busy={remove.isPending}
        unavailable={userID === ctx.userID ? "This is your own account." : undefined}
        onConfirm={() => remove.mutate(userID, { onSuccess: () => navigation.goBack() })}
      />
    </SettingsList>
  );
}
