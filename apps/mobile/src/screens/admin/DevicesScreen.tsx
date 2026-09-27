//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { formatLastSeen, useDevices, useQueryContext } from "@anemone/core";
import type { DeviceInfoDto } from "@jellyfin/sdk/lib/generated-client/models/device-info-dto";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BrowseParamList } from "../../navigation/routes";
import { AdminListPage, listQuery } from "./AdminListPage";
import { AdminRow, RowIcon } from "./AdminRow";
import { deviceIcon } from "./adminFormat";

/** A device's name as shown: the admin's custom name, else its own. */
export function deviceName(device: DeviceInfoDto): string {
  return device.CustomName || device.Name || "Unknown device";
}

/** Every device signed in to the server, most recently active first (Swiftfin `DevicesView`). */
export function DevicesScreen({ navigation }: NativeStackScreenProps<BrowseParamList, "AdminDevices">) {
  const { api } = useQueryContext();
  const thisDeviceID = api.deviceInfo.id;
  const query = useDevices();

  return (
    <AdminListPage
      title="Devices"
      query={listQuery(query)}
      emptyText="No devices."
      keyExtractor={(device, index) => device.Id ?? String(index)}
      renderItem={(device) => (
        <AdminRow
          leading={<RowIcon name={deviceIcon(device.AppName, device.Name)} />}
          title={deviceName(device)}
          badges={device.Id === thisDeviceID ? [{ label: "This device", tone: "accent" }] : undefined}
          lines={[
            [device.AppName, device.AppVersion].filter(Boolean).join(" "),
            [device.LastUserName, formatLastSeen(device.DateLastActivity)].filter(Boolean).join(" · "),
          ]}
          onPress={() => device.Id && navigation.push("AdminDevice", { deviceID: device.Id })}
        />
      )}
    />
  );
}
