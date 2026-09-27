//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { formatLastSeen, useQueryContext, userImageURL, useServerUsers } from "@anemone/core";
import type { UserDto } from "@jellyfin/sdk/lib/generated-client/models/user-dto";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BrowseParamList } from "../../navigation/routes";
import { Avatar } from "../../ui/Avatar";
import { Button } from "../../ui/Button";
import { AdminListPage, listQuery } from "./AdminListPage";
import { AdminRow, type RowBadge, ROW_LEADING_SIZE } from "./AdminRow";
import { AdminToolbar } from "./FilterChips";

/** What stands out about a user's account at a glance. */
export function userBadges(user: UserDto): RowBadge[] {
  const policy = user.Policy;
  return [
    ...(policy?.IsAdministrator ? [{ label: "Administrator", tone: "accent" } as const] : []),
    ...(policy?.IsDisabled ? [{ label: "Disabled", tone: "error" } as const] : []),
    ...(policy?.IsHidden ? [{ label: "Hidden" }] : []),
  ];
}

/** "Active 3 hours ago", or that they never have been. */
export function userActivity(user: UserDto): string {
  const lastSeen = formatLastSeen(user.LastActivityDate);
  return lastSeen ? `Active ${lastSeen.charAt(0).toLowerCase()}${lastSeen.slice(1)}` : "Never active";
}

/** Every account on the server, by name (Swiftfin `ServerUsersView`), with Add User. */
export function UsersScreen({ navigation }: NativeStackScreenProps<BrowseParamList, "AdminUsers">) {
  const { api } = useQueryContext();
  const query = useServerUsers();

  return (
    <AdminListPage
      title="Users"
      toolbar={
        <AdminToolbar>
          <Button
            label="Add User"
            icon="person-add-outline"
            variant="secondary"
            onPress={() => navigation.push("AdminAddUser")}
          />
        </AdminToolbar>
      }
      query={listQuery(query)}
      emptyText="No users."
      keyExtractor={(user, index) => user.Id ?? String(index)}
      renderItem={(user) => (
        <AdminRow
          leading={<Avatar name={user.Name} imageURL={userImageURL(api, user)} size={ROW_LEADING_SIZE} />}
          title={user.Name ?? "Unknown user"}
          badges={userBadges(user)}
          lines={[userActivity(user), user.HasPassword === false ? "No password" : undefined]}
          onPress={() => user.Id && navigation.push("AdminUser", { userID: user.Id })}
        />
      )}
    />
  );
}
