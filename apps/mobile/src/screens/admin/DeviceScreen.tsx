//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  formatLastSeen,
  useDeleteDevice,
  useDevice,
  useQueryContext,
  useRenameDevice,
} from "@anemone/core";
import type { DeviceInfoDto } from "@jellyfin/sdk/lib/generated-client/models/device-info-dto";
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
import { deviceName } from "./DevicesScreen";

type Props = NativeStackScreenProps<BrowseParamList, "AdminDevice">;

/**
 * One device (Swiftfin `DeviceDetailsView`): give it a custom name, see who last used it and what
 * it can do, or sign it out of the server. This device can't be deleted from itself.
 */
export function DeviceScreen({ navigation, route }: Props) {
  const { data: device, error, refetch } = useDevice(route.params.deviceID);
  if (!device) {
    return <DetailPlaceholder title="Device" error={error} onRetry={() => void refetch()} />;
  }
  return <DeviceDetails device={device} navigation={navigation} />;
}

function DeviceDetails({ device, navigation }: { device: DeviceInfoDto; navigation: Props["navigation"] }) {
  const { api } = useQueryContext();
  const rename = useRenameDevice();
  const remove = useDeleteDevice();
  const [customName, setCustomName] = useState(device.CustomName ?? "");
  const deviceID = device.Id ?? "";
  const lastUserID = device.LastUserId;
  const capabilities = device.Capabilities;
  const mediaTypes = capabilities?.PlayableMediaTypes?.join(", ");

  return (
    <SettingsList title={deviceName(device)} back>
      <SettingsSection
        title="Custom name"
        footer={rename.isError ? "Couldn't save the name. Try again." : "Leave empty to use the device's own name."}
      >
        <TextSetting label={device.Name ?? "Name"} defaultValue={device.CustomName ?? ""} onChangeText={setCustomName} />
        <ActionSetting
          label="Save"
          busy={rename.isPending}
          disabled={customName.trim() === (device.CustomName ?? "")}
          onPress={() => rename.mutate({ deviceID, name: customName })}
        />
      </SettingsSection>

      {lastUserID ? (
        <SettingsSection title="Last used by">
          <LinkSetting
            label={device.LastUserName ?? "User"}
            icon={{ icon: "person-circle-outline", systemImage: "person.crop.circle" }}
            detail={formatLastSeen(device.DateLastActivity)}
            onPress={() => navigation.push("AdminUser", { userID: lastUserID })}
          />
        </SettingsSection>
      ) : null}

      <SettingsSection title="Device">
        <InfoSetting label="App" value={device.AppName ?? undefined} />
        <InfoSetting label="Version" value={device.AppVersion ?? undefined} />
        <InfoSetting label="Device" value={device.Name ?? undefined} />
        {mediaTypes ? <InfoSetting label="Plays" value={mediaTypes} /> : null}
        <InfoSetting label="Remote control" value={capabilities?.SupportsMediaControl ? "Yes" : "No"} />
      </SettingsSection>

      <DeleteSection
        label="Delete Device"
        prompt={`Sign ${deviceName(device)} out of the server? It will need to sign in again.`}
        busy={remove.isPending}
        unavailable={deviceID === api.deviceInfo.id ? "This is the device you're using." : undefined}
        onConfirm={() => remove.mutate(deviceID, { onSuccess: () => navigation.goBack() })}
      />
    </SettingsList>
  );
}
