//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// React hooks for the admin dashboard: reads resolve the session's `QueryContext` and delegate to
// `adminQueries.ts`; writes (`adminActions.ts`) refresh the lists they change.
//

import type { ActivityLogEntry } from "@jellyfin/sdk/lib/generated-client/models/activity-log-entry";
import type { ActivityLogEntryQueryResult } from "@jellyfin/sdk/lib/generated-client/models/activity-log-entry-query-result";
import type { UserDto } from "@jellyfin/sdk/lib/generated-client/models/user-dto";
import type { UserPolicy } from "@jellyfin/sdk/lib/generated-client/models/user-policy";
import {
    type InfiniteData,
    type QueryKey,
    useInfiniteQuery,
    useMutation,
    useQuery,
    useQueryClient,
} from "@tanstack/react-query";
import { useQueryContext } from "../react/context";
import { jellyfinKeys } from "../query/queryKeys";
import {
    createServerUser,
    deleteDevice,
    deleteServerUser,
    renameDevice,
    renameServerUser,
    setServerUserPassword,
    updateServerUserPolicy,
} from "./adminActions";
import {
    type ActivityFilter,
    activeSessionsQuery,
    activityLogInfiniteQuery,
    currentUserQuery,
    deviceQuery,
    devicesQuery,
    SESSIONS_REFRESH_INTERVAL,
    serverUserQuery,
    serverUsersQuery,
} from "./adminQueries";
import { dashboardSessions, type SessionFilter } from "./sessions";

export function useCurrentUser() {
    return useQuery(currentUserQuery(useQueryContext()));
}

/** Whether the signed-in user administers the server (false until known). */
export function useIsAdministrator(): boolean {
    return useCurrentUser().data?.Policy?.IsAdministrator ?? false;
}

/**
 * The server's sessions in dashboard order. `live` polls while the list is on screen — pass
 * whether the screen is focused so a hidden list stops asking.
 */
export function useActiveSessions(options: {
    activeWithinSeconds?: number;
    filter: SessionFilter;
    live: boolean;
}) {
    return useQuery({
        ...activeSessionsQuery(useQueryContext(), options.activeWithinSeconds),
        select: (sessions) => dashboardSessions(sessions, options.filter),
        refetchInterval: options.live ? SESSIONS_REFRESH_INTERVAL : false,
    });
}

/** One session, kept live while `live`; `data` is `undefined` once it has ended. */
export function useActiveSession(sessionID: string, live: boolean) {
    return useQuery({
        ...activeSessionsQuery(useQueryContext()),
        select: (sessions) => sessions.find((session) => session.Id === sessionID),
        refetchInterval: live ? SESSIONS_REFRESH_INTERVAL : false,
    });
}

export function useActivityLog(filter: ActivityFilter) {
    return useInfiniteQuery(activityLogInfiniteQuery(useQueryContext(), filter));
}

/**
 * An activity entry already loaded by an activity list (the server can't fetch one by id), or
 * `undefined` — e.g. after a web refresh on its detail page.
 */
export function useLoadedActivityEntry(entryID: number): ActivityLogEntry | undefined {
    const ctx = useQueryContext();
    const queryClient = useQueryClient();
    const lists = queryClient.getQueriesData<InfiniteData<ActivityLogEntryQueryResult>>({
        queryKey: jellyfinKeys.adminAllActivity(ctx.userID),
    });
    for (const [, data] of lists) {
        for (const page of data?.pages ?? []) {
            const entry = page.Items?.find((item) => item.Id === entryID);
            if (entry) {
                return entry;
            }
        }
    }
    return undefined;
}

export function useDevices() {
    return useQuery(devicesQuery(useQueryContext()));
}

export function useDevice(deviceID: string) {
    return useQuery(deviceQuery(useQueryContext(), deviceID));
}

export function useServerUsers() {
    return useQuery(serverUsersQuery(useQueryContext()));
}

export function useServerUser(serverUserID: string) {
    return useQuery(serverUserQuery(useQueryContext(), serverUserID));
}

/** A write whose success refreshes every query under `invalidates` (and, for users, ourselves). */
function useAdminMutation<Variables, Result>(
    action: (variables: Variables) => Promise<Result>,
    invalidates: (userID: string) => QueryKey,
) {
    const ctx = useQueryContext();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: action,
        onSuccess: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: invalidates(ctx.userID) }),
                queryClient.invalidateQueries({ queryKey: jellyfinKeys.currentUser(ctx.userID) }),
            ]);
        },
    });
}

export function useRenameDevice() {
    const { api } = useQueryContext();
    return useAdminMutation(
        ({ deviceID, name }: { deviceID: string; name: string }) => renameDevice(api, deviceID, name),
        jellyfinKeys.adminDevices,
    );
}

export function useDeleteDevice() {
    const { api } = useQueryContext();
    return useAdminMutation((deviceID: string) => deleteDevice(api, deviceID), jellyfinKeys.adminDevices);
}

export function useCreateServerUser() {
    const { api } = useQueryContext();
    return useAdminMutation(
        ({ name, password }: { name: string; password: string }) => createServerUser(api, name, password),
        jellyfinKeys.adminUsers,
    );
}

export function useDeleteServerUser() {
    const { api } = useQueryContext();
    return useAdminMutation((userID: string) => deleteServerUser(api, userID), jellyfinKeys.adminUsers);
}

export function useRenameServerUser() {
    const { api } = useQueryContext();
    return useAdminMutation(
        ({ user, name }: { user: UserDto; name: string }) => renameServerUser(api, user, name),
        jellyfinKeys.adminUsers,
    );
}

export function useSetServerUserPassword() {
    const { api } = useQueryContext();
    return useAdminMutation(
        ({ userID, password }: { userID: string; password: string }) =>
            setServerUserPassword(api, userID, password),
        jellyfinKeys.adminUsers,
    );
}

/**
 * Change a user's policy. The user's cached details update at once (a permission toggle flips
 * immediately) and roll back if the server refuses.
 */
export function useUpdateServerUserPolicy() {
    const ctx = useQueryContext();
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ userID, policy }: { userID: string; policy: UserPolicy }) =>
            updateServerUserPolicy(ctx.api, userID, policy),
        onMutate: async ({ userID, policy }) => {
            const key = jellyfinKeys.adminUser(ctx.userID, userID);
            await queryClient.cancelQueries({ queryKey: key });
            const previous = queryClient.getQueryData<UserDto>(key);
            if (previous) {
                queryClient.setQueryData<UserDto>(key, { ...previous, Policy: policy });
            }
            return { key, previous };
        },
        onError: (_error, _variables, context) => {
            if (context?.previous) {
                queryClient.setQueryData(context.key, context.previous);
            }
        },
        onSettled: async () => {
            await Promise.all([
                queryClient.invalidateQueries({ queryKey: jellyfinKeys.adminUsers(ctx.userID) }),
                queryClient.invalidateQueries({ queryKey: jellyfinKeys.currentUser(ctx.userID) }),
            ]);
        },
    });
}
