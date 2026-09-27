//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// Server sessions for the admin dashboard (Swiftfin `ActiveSessionsViewModel` and the
// `SessionInfoDto` extensions): which to show, in what order, and how they're playing.
//

import { PlayMethod } from "@jellyfin/sdk/lib/generated-client/models/play-method";
import type { SessionInfoDto } from "@jellyfin/sdk/lib/generated-client/models/session-info-dto";
import { ticksToSeconds } from "../jellyfin/ticks";

/** Which sessions the list shows: all of them, only those playing something, or only idle ones. */
export type SessionFilter = "all" | "playing" | "idle";

/** Whether a session is playing something right now. */
export function isSessionPlaying(session: SessionInfoDto): boolean {
    return session.NowPlayingItem != null && session.PlayState != null;
}

export function filterSessions(
    sessions: readonly SessionInfoDto[],
    filter: SessionFilter,
): SessionInfoDto[] {
    switch (filter) {
        case "all":
            return [...sessions];
        case "playing":
            return sessions.filter(isSessionPlaying);
        case "idle":
            return sessions.filter((session) => !isSessionPlaying(session));
    }
}

function time(isoDate: string | null | undefined): number {
    return isoDate ? Date.parse(isoDate) || 0 : 0;
}

/**
 * Swiftfin's session order: playing sessions first, then by user name; playing sessions of the
 * same user by title, idle ones most recently active first.
 */
export function compareSessions(a: SessionInfoDto, b: SessionInfoDto): number {
    const aPlaying = isSessionPlaying(a);
    const bPlaying = isSessionPlaying(b);
    if (aPlaying !== bPlaying) {
        return aPlaying ? -1 : 1;
    }
    const byUser = (a.UserName ?? "").localeCompare(b.UserName ?? "");
    if (byUser !== 0) {
        return byUser;
    }
    if (aPlaying) {
        return (a.NowPlayingItem?.Name ?? "").localeCompare(b.NowPlayingItem?.Name ?? "");
    }
    return time(b.LastActivityDate) - time(a.LastActivityDate);
}

/** The sessions to show for `filter`, in dashboard order. */
export function dashboardSessions(
    sessions: readonly SessionInfoDto[],
    filter: SessionFilter,
): SessionInfoDto[] {
    return filterSessions(sessions, filter).sort(compareSessions);
}

export interface SessionProgress {
    readonly positionSeconds: number;
    readonly durationSeconds: number;
    /** 0–1 through the item. */
    readonly fraction: number;
    /** 0–1 of the item the transcoder has produced, when transcoding. */
    readonly transcodedFraction?: number;
    readonly isPaused: boolean;
}

/** How far through its item a playing session is; `undefined` when idle or the length is unknown. */
export function sessionProgress(session: SessionInfoDto): SessionProgress | undefined {
    const durationTicks = session.NowPlayingItem?.RunTimeTicks;
    if (!isSessionPlaying(session) || !durationTicks) {
        return undefined;
    }
    const durationSeconds = ticksToSeconds(durationTicks);
    const positionSeconds = ticksToSeconds(session.PlayState?.PositionTicks ?? 0);
    const completion = session.TranscodingInfo?.CompletionPercentage;
    return {
        positionSeconds,
        durationSeconds,
        fraction: Math.min(1, Math.max(0, positionSeconds / durationSeconds)),
        transcodedFraction: completion != null ? Math.min(1, completion / 100) : undefined,
        isPaused: session.PlayState?.IsPaused ?? false,
    };
}

/**
 * How a playing session is being streamed (Swiftfin `playMethodDisplayTitle`): a transcode that
 * copies both streams is a remux, one that copies only the video a direct stream.
 */
export function playMethodTitle(session: SessionInfoDto): string | undefined {
    const playMethod = session.PlayState?.PlayMethod;
    if (!session.NowPlayingItem || !playMethod) {
        return undefined;
    }
    const transcoding = session.TranscodingInfo;
    if (transcoding) {
        const videoDirect = transcoding.IsVideoDirect ?? false;
        const hasVideoCodec = transcoding.VideoCodec != null;
        if ((videoDirect || hasVideoCodec) && (transcoding.IsAudioDirect ?? false)) {
            return "Remux";
        }
        if (videoDirect) {
            return "Direct Stream";
        }
    }
    return playMethod === PlayMethod.Transcode ? "Transcode" : "Direct Play";
}

/** A server enum value (`ContainerNotSupported`) as a sentence (`Container not supported`). */
export function humanizeEnumValue(value: string): string {
    const words = value
        .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
        .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
        .toLowerCase();
    return words.charAt(0).toUpperCase() + words.slice(1);
}
