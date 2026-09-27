//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// TanStack Query option builders for the admin dashboard (Swiftfin `ActiveSessionsViewModel`,
// `ServerActivityViewModel`, `DevicesViewModel`, `ServerUsersViewModel`). Every endpoint here
// needs an administrator; `currentUserQuery` tells the UI whether to offer them.
//

import type { ActivityLogEntryQueryResult } from "@jellyfin/sdk/lib/generated-client/models/activity-log-entry-query-result";
import type { DeviceInfoDto } from "@jellyfin/sdk/lib/generated-client/models/device-info-dto";
import type { SessionInfoDto } from "@jellyfin/sdk/lib/generated-client/models/session-info-dto";
import type { UserDto } from "@jellyfin/sdk/lib/generated-client/models/user-dto";
import { infiniteQueryOptions, queryOptions } from "@tanstack/react-query";
import { getDeviceApi, getSessionApi, getSystemApi, getUserApi } from "../jellyfin/api";
import type { QueryContext } from "../query/queryContext";
import { jellyfinKeys } from "../query/queryKeys";

/** How often the session list refetches while it's on screen (Swiftfin polls every 5 s too). */
export const SESSIONS_REFRESH_INTERVAL = 5_000;

export const ACTIVITY_PAGE_SIZE = 50;

/** Which activity entries to list: everything, user actions only, or server (system) events. */
export type ActivityFilter = "all" | "users" | "system";

const HAS_USER_ID: Record<ActivityFilter, boolean | undefined> = {
    all: undefined,
    users: true,
    system: false,
};

function byLastActivity(a: DeviceInfoDto, b: DeviceInfoDto): number {
    return Date.parse(b.DateLastActivity ?? "") - Date.parse(a.DateLastActivity ?? "") || 0;
}

/** The signed-in user, fresh from the server — its `Policy.IsAdministrator` gates the dashboard. */
export function currentUserQuery(ctx: QueryContext) {
    return queryOptions({
        queryKey: jellyfinKeys.currentUser(ctx.userID),
        queryFn: async (): Promise<UserDto> => (await getUserApi(ctx.api).getCurrentUser()).data,
        staleTime: 60_000,
    });
}

/** Sessions active within `activeWithinSeconds` (all known sessions when omitted). */
export function activeSessionsQuery(ctx: QueryContext, activeWithinSeconds?: number) {
    return queryOptions({
        queryKey: jellyfinKeys.adminSessions(ctx.userID, activeWithinSeconds),
        queryFn: async (): Promise<SessionInfoDto[]> =>
            (await getSessionApi(ctx.api).getSessions({ activeWithinSeconds })).data,
    });
}

/** The server's activity log, newest first, a page at a time. */
export function activityLogInfiniteQuery(ctx: QueryContext, filter: ActivityFilter) {
    return infiniteQueryOptions({
        queryKey: jellyfinKeys.adminActivity(ctx.userID, { filter }),
        initialPageParam: 0,
        queryFn: async ({ pageParam }): Promise<ActivityLogEntryQueryResult> => {
            const response = await getSystemApi(ctx.api).getLogEntries({
                startIndex: pageParam * ACTIVITY_PAGE_SIZE,
                limit: ACTIVITY_PAGE_SIZE,
                hasUserId: HAS_USER_ID[filter],
            });
            return response.data;
        },
        getNextPageParam: (lastPage, allPages) =>
            (lastPage.Items?.length ?? 0) < ACTIVITY_PAGE_SIZE ? undefined : allPages.length,
    });
}

/** Every device that has signed in to the server, most recently active first. */
export function devicesQuery(ctx: QueryContext) {
    return queryOptions({
        queryKey: jellyfinKeys.adminDevices(ctx.userID),
        queryFn: async (): Promise<DeviceInfoDto[]> =>
            [...((await getDeviceApi(ctx.api).getDevices()).data.Items ?? [])].sort(byLastActivity),
    });
}

export function deviceQuery(ctx: QueryContext, deviceID: string) {
    return queryOptions({
        queryKey: jellyfinKeys.adminDevice(ctx.userID, deviceID),
        queryFn: async (): Promise<DeviceInfoDto> =>
            (await getDeviceApi(ctx.api).getDeviceInfo({ id: deviceID })).data,
    });
}

/** Every user on the server, by name. */
export function serverUsersQuery(ctx: QueryContext) {
    return queryOptions({
        queryKey: jellyfinKeys.adminUsers(ctx.userID),
        queryFn: async (): Promise<UserDto[]> =>
            [...(await getUserApi(ctx.api).getUsers()).data].sort((a, b) =>
                (a.Name ?? "").localeCompare(b.Name ?? ""),
            ),
    });
}

export function serverUserQuery(ctx: QueryContext, serverUserID: string) {
    return queryOptions({
        queryKey: jellyfinKeys.adminUser(ctx.userID, serverUserID),
        queryFn: async (): Promise<UserDto> =>
            (await getUserApi(ctx.api).getUserById({ userId: serverUserID })).data,
    });
}
