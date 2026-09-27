//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { useQueryContext, useServerUser, useUpdateServerUserPolicy } from "@anemone/core";
import type { UserDto } from "@jellyfin/sdk/lib/generated-client/models/user-dto";
import type { UserPolicy } from "@jellyfin/sdk/lib/generated-client/models/user-policy";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BrowseParamList } from "../../navigation/routes";
import { SettingsList, SettingsSection, ToggleSetting } from "../../ui/settings";
import { DetailPlaceholder } from "./DetailPlaceholder";

/** The on/off fields of a user policy. */
type PolicyFlag = {
  [Key in keyof UserPolicy]-?: NonNullable<UserPolicy[Key]> extends boolean ? Key : never;
}[keyof UserPolicy];

interface Permission {
  readonly flag: PolicyFlag;
  readonly label: string;
  readonly description?: string;
  /** Can't be changed on your own account (you'd lock yourself out). */
  readonly notForSelf?: boolean;
}

/** Swiftfin `ServerUserPermissionsView`'s sections (the on/off ones). */
const PERMISSION_SECTIONS: readonly { title: string; permissions: readonly Permission[] }[] = [
  {
    title: "Status",
    permissions: [
      {
        flag: "IsAdministrator",
        label: "Administrator",
        description: "Full control of the server, including this dashboard.",
        notForSelf: true,
      },
      {
        flag: "IsDisabled",
        label: "Disabled",
        description: "The user can't sign in.",
        notForSelf: true,
      },
      { flag: "IsHidden", label: "Hidden", description: "Not listed on sign-in screens." },
      { flag: "EnableUserPreferenceAccess", label: "Can change own preferences" },
    ],
  },
  {
    title: "Media playback",
    permissions: [
      { flag: "EnableMediaPlayback", label: "Media playback" },
      { flag: "EnableAudioPlaybackTranscoding", label: "Audio transcoding" },
      { flag: "EnableVideoPlaybackTranscoding", label: "Video transcoding" },
      { flag: "EnablePlaybackRemuxing", label: "Remuxing" },
      {
        flag: "ForceRemoteSourceTranscoding",
        label: "Force transcoding of remote sources",
      },
    ],
  },
  {
    title: "Management",
    permissions: [
      { flag: "EnableCollectionManagement", label: "Manage collections" },
      { flag: "EnableSubtitleManagement", label: "Manage subtitles" },
      { flag: "EnableLyricManagement", label: "Manage lyrics" },
      { flag: "EnableLiveTvManagement", label: "Manage Live TV" },
      { flag: "EnableContentDeletion", label: "Delete media", description: "From every library." },
    ],
  },
  {
    title: "External access",
    permissions: [
      {
        flag: "EnableRemoteAccess",
        label: "Remote access",
        description: "Connect from outside the server's local network.",
      },
      { flag: "EnableContentDownloading", label: "Downloads" },
    ],
  },
  {
    title: "Remote control",
    permissions: [
      { flag: "EnableRemoteControlOfOtherUsers", label: "Control other users' sessions" },
      { flag: "EnableSharedDeviceControl", label: "Control shared devices" },
    ],
  },
];

type Props = NativeStackScreenProps<BrowseParamList, "AdminUserPermissions">;

/** A user's permissions; each switch saves as soon as it's flipped (and flips back on failure). */
export function UserPermissionsScreen({ route }: Props) {
  const { data: user, error, refetch } = useServerUser(route.params.userID);
  if (!user?.Policy) {
    return <DetailPlaceholder title="Permissions" error={error} onRetry={() => void refetch()} />;
  }
  return <Permissions user={user} policy={user.Policy} />;
}

function Permissions({ user, policy }: { user: UserDto; policy: UserPolicy }) {
  const ctx = useQueryContext();
  const update = useUpdateServerUserPolicy();
  const isSelf = user.Id === ctx.userID;
  const setFlag = (flag: PolicyFlag, value: boolean) =>
    user.Id && update.mutate({ userID: user.Id, policy: { ...policy, [flag]: value } });

  return (
    <SettingsList title="Permissions" back>
      {PERMISSION_SECTIONS.map((section) => (
        <SettingsSection
          key={section.title}
          title={section.title}
          footer={
            isSelf && section.permissions.some((permission) => permission.notForSelf)
              ? "You can't remove your own administrator access or disable yourself."
              : undefined
          }
        >
          {section.permissions
            .filter((permission) => !(isSelf && permission.notForSelf))
            .map((permission) => (
              <ToggleSetting
                key={permission.flag}
                label={permission.label}
                description={permission.description}
                value={policy[permission.flag] ?? false}
                onChange={(value) => setFlag(permission.flag, value)}
              />
            ))}
        </SettingsSection>
      ))}
    </SettingsList>
  );
}
