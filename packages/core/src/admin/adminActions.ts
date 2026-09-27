//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// Admin dashboard writes (Swiftfin `DevicesViewModel`, `ServerUsersViewModel`,
// `ServerUserAdminViewModel`, `AddServerUserViewModel`, `ResetUserPasswordViewModel`).
//

import type { UserDto } from "@jellyfin/sdk/lib/generated-client/models/user-dto";
import type { UserPolicy } from "@jellyfin/sdk/lib/generated-client/models/user-policy";
import { getDeviceApi, getUserApi } from "../jellyfin/api";
import type { Api } from "../jellyfin/client";

/** Set a device's display name; an empty name clears it, so the device's own name shows again. */
export async function renameDevice(api: Api, deviceID: string, customName: string): Promise<void> {
    const trimmed = customName.trim();
    await getDeviceApi(api).updateDeviceOptions({
        id: deviceID,
        deviceOptionsDto: { CustomName: trimmed === "" ? null : trimmed },
    });
}

/** Sign a device out of the server and forget it. */
export async function deleteDevice(api: Api, deviceID: string): Promise<void> {
    await getDeviceApi(api).deleteDevice({ id: [deviceID] });
}

export async function createServerUser(api: Api, name: string, password: string): Promise<UserDto> {
    const response = await getUserApi(api).createUserByName({
        createUserByName: { Name: name.trim(), Password: password === "" ? null : password },
    });
    return response.data;
}

export async function deleteServerUser(api: Api, userID: string): Promise<void> {
    await getUserApi(api).deleteUser({ userId: userID });
}

/** Rename a user. The server takes the whole `UserDto`, so pass the current one. */
export async function renameServerUser(api: Api, user: UserDto, name: string): Promise<void> {
    await getUserApi(api).updateUser({ userId: user.Id, userDto: { ...user, Name: name.trim() } });
}

export async function updateServerUserPolicy(api: Api, userID: string, policy: UserPolicy): Promise<void> {
    await getUserApi(api).updateUserPolicy({ userId: userID, userPolicy: policy });
}

/** Set a user's password as an administrator (no current password needed); empty removes it. */
export async function setServerUserPassword(api: Api, userID: string, password: string): Promise<void> {
    await getUserApi(api).updateUserPassword({
        userId: userID,
        updateUserPassword: { NewPw: password, ResetPassword: false },
    });
}
