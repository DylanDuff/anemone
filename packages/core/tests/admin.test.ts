//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { SessionInfoDto } from "@jellyfin/sdk/lib/generated-client/models/session-info-dto";
import type { QueryFunctionContext } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";

const calls: Record<string, unknown> = {};

vi.mock("../src/jellyfin/api", () => ({
    getSessionApi: () => ({
        getSessions: async (p: unknown) => {
            calls.getSessions = p;
            return { data: [{ Id: "s1" }] };
        },
    }),
    getSystemApi: () => ({
        getLogEntries: async (p: unknown) => {
            calls.getLogEntries = p;
            return { data: { Items: [{ Id: 1 }], TotalRecordCount: 1 } };
        },
    }),
    getDeviceApi: () => ({
        getDevices: async () => ({
            data: {
                Items: [
                    { Id: "old", DateLastActivity: "2026-01-01T00:00:00Z" },
                    { Id: "new", DateLastActivity: "2026-09-01T00:00:00Z" },
                ],
            },
        }),
        updateDeviceOptions: async (p: unknown) => {
            calls.updateDeviceOptions = p;
        },
        deleteDevice: async (p: unknown) => {
            calls.deleteDevice = p;
        },
    }),
    getUserApi: () => ({
        getUsers: async () => ({ data: [{ Name: "zoe" }, { Name: "adam" }] }),
        createUserByName: async (p: unknown) => {
            calls.createUserByName = p;
            return { data: { Id: "u2" } };
        },
        updateUser: async (p: unknown) => {
            calls.updateUser = p;
        },
    }),
}));

import {
    activeSessionsQuery,
    activityLogInfiniteQuery,
    createServerUser,
    dashboardSessions,
    deleteDevice,
    devicesQuery,
    formatLastSeen,
    humanizeEnumValue,
    playMethodTitle,
    renameDevice,
    renameServerUser,
    serverUsersQuery,
    sessionProgress,
} from "../src";
import type { Api } from "../src/jellyfin/client";
import type { QueryContext } from "../src/query/queryContext";

const api = {} as Api;
const ctx: QueryContext = { api, userID: "u1" };
const fnCtx = { signal: new AbortController().signal } as QueryFunctionContext<never, never>;

beforeEach(() => {
    for (const key of Object.keys(calls)) {
        delete calls[key];
    }
});

const playing = (user: string, title: string): SessionInfoDto => ({
    Id: `${user}-${title}`,
    UserName: user,
    NowPlayingItem: { Name: title, RunTimeTicks: 600_000_000 },
    PlayState: { PositionTicks: 150_000_000, PlayMethod: "DirectPlay" },
});
const idle = (user: string, lastActivity: string): SessionInfoDto => ({
    Id: `${user}-${lastActivity}`,
    UserName: user,
    LastActivityDate: lastActivity,
});

describe("sessions", () => {
    it("orders playing first, then by user, title and recency", () => {
        const sessions = [
            idle("bob", "2026-09-01T00:00:00Z"),
            playing("bob", "Zodiac"),
            idle("bob", "2026-09-02T00:00:00Z"),
            playing("amy", "Up"),
            playing("bob", "Alien"),
        ];
        expect(dashboardSessions(sessions, "all").map((session) => session.Id)).toEqual([
            "amy-Up",
            "bob-Alien",
            "bob-Zodiac",
            "bob-2026-09-02T00:00:00Z",
            "bob-2026-09-01T00:00:00Z",
        ]);
        expect(dashboardSessions(sessions, "playing")).toHaveLength(3);
        expect(dashboardSessions(sessions, "idle")).toHaveLength(2);
    });

    it("reports progress through the playing item", () => {
        expect(sessionProgress(playing("amy", "Up"))).toEqual({
            positionSeconds: 15,
            durationSeconds: 60,
            fraction: 0.25,
            transcodedFraction: undefined,
            isPaused: false,
        });
        expect(sessionProgress(idle("amy", "2026-09-01T00:00:00Z"))).toBeUndefined();
    });

    it("names the play method like Swiftfin", () => {
        const session = playing("amy", "Up");
        expect(playMethodTitle(session)).toBe("Direct Play");
        expect(
            playMethodTitle({
                ...session,
                PlayState: { PlayMethod: "Transcode" },
                TranscodingInfo: { IsVideoDirect: true, IsAudioDirect: true },
            }),
        ).toBe("Remux");
        expect(
            playMethodTitle({
                ...session,
                PlayState: { PlayMethod: "Transcode" },
                TranscodingInfo: { IsVideoDirect: true, IsAudioDirect: false },
            }),
        ).toBe("Direct Stream");
        expect(
            playMethodTitle({
                ...session,
                PlayState: { PlayMethod: "Transcode" },
                TranscodingInfo: { IsVideoDirect: false, IsAudioDirect: false },
            }),
        ).toBe("Transcode");
        expect(playMethodTitle(idle("amy", "2026-09-01T00:00:00Z"))).toBeUndefined();
    });

    it("humanizes server enum values", () => {
        expect(humanizeEnumValue("ContainerNotSupported")).toBe("Container not supported");
        expect(humanizeEnumValue("VideoRangeTypeNotSupported")).toBe("Video range type not supported");
    });
});

describe("formatLastSeen", () => {
    const now = Date.parse("2026-09-27T12:00:00Z");
    it("describes recent times relatively", () => {
        expect(formatLastSeen("2026-09-27T11:59:30Z", now)).toBe("Just now");
        expect(formatLastSeen("2026-09-27T11:59:00Z", now)).toBe("1 minute ago");
        expect(formatLastSeen("2026-09-27T09:00:00Z", now)).toBe("3 hours ago");
        expect(formatLastSeen("2026-09-25T12:00:00Z", now)).toBe("2 days ago");
    });
    it("falls back to the date, and handles missing dates", () => {
        expect(formatLastSeen("2026-08-01T12:00:00Z", now)).not.toContain("ago");
        expect(formatLastSeen(undefined, now)).toBeUndefined();
        expect(formatLastSeen("nonsense", now)).toBeUndefined();
    });
});

describe("admin queries", () => {
    it("asks for sessions active within a window", async () => {
        const options = activeSessionsQuery(ctx, 900);
        expect(options.queryKey).toEqual(["jellyfin", "u1", "admin", "sessions", 900]);
        expect(await options.queryFn!(fnCtx)).toEqual([{ Id: "s1" }]);
        expect(calls.getSessions).toEqual({ activeWithinSeconds: 900 });
    });

    it("pages the activity log and filters by who did it", async () => {
        const options = activityLogInfiniteQuery(ctx, "system");
        await options.queryFn!({ ...fnCtx, pageParam: 2 } as never);
        expect(calls.getLogEntries).toEqual({ startIndex: 100, limit: 50, hasUserId: false });
        expect(options.getNextPageParam({ Items: [{}] }, [{}], 0, [0])).toBeUndefined();
    });

    it("sorts devices by last activity and users by name", async () => {
        const devices = await devicesQuery(ctx).queryFn!(fnCtx);
        expect(devices.map((device) => device.Id)).toEqual(["new", "old"]);
        const users = await serverUsersQuery(ctx).queryFn!(fnCtx);
        expect(users.map((user) => user.Name)).toEqual(["adam", "zoe"]);
    });
});

describe("admin actions", () => {
    it("clears a device's custom name when renamed to blank", async () => {
        await renameDevice(api, "d1", "   ");
        expect(calls.updateDeviceOptions).toEqual({ id: "d1", deviceOptionsDto: { CustomName: null } });
        await renameDevice(api, "d1", " Lounge TV ");
        expect(calls.updateDeviceOptions).toEqual({
            id: "d1",
            deviceOptionsDto: { CustomName: "Lounge TV" },
        });
    });

    it("deletes a device by id", async () => {
        await deleteDevice(api, "d1");
        expect(calls.deleteDevice).toEqual({ id: ["d1"] });
    });

    it("creates a user without a password when none is given", async () => {
        await createServerUser(api, " kid ", "");
        expect(calls.createUserByName).toEqual({ createUserByName: { Name: "kid", Password: null } });
    });

    it("renames a user by sending the whole user back", async () => {
        await renameServerUser(api, { Id: "u2", Name: "old", EnableAutoLogin: true }, "new");
        expect(calls.updateUser).toEqual({
            userId: "u2",
            userDto: { Id: "u2", Name: "new", EnableAutoLogin: true },
        });
    });
});
