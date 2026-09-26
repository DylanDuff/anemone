//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

/** Jellyfin measures durations in "ticks": 100-nanosecond intervals (10,000,000 per second). */
export const TICKS_PER_SECOND = 10_000_000;

export function ticksToSeconds(ticks: number): number {
    return ticks / TICKS_PER_SECOND;
}

export function secondsToTicks(seconds: number): number {
    return Math.round(seconds * TICKS_PER_SECOND);
}

/** A player clock: "4:05", "1:02:03". Hours appear once the position or `total` needs them. */
export function formatClock(totalSeconds: number, referenceSeconds = totalSeconds): string {
    const seconds = Math.max(0, Math.floor(totalSeconds));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secondsPart = String(seconds % 60).padStart(2, "0");

    if (hours > 0 || referenceSeconds >= 3600) {
        return `${hours}:${String(minutes).padStart(2, "0")}:${secondsPart}`;
    }
    return `${minutes}:${secondsPart}`;
}

/**
 * Format a duration in seconds as an abbreviated hours/minutes label (e.g. "1h 23m", "45m"),
 * mirroring Swiftfin's `DateComponentsFormatter` with `[.hour, .minute]`. Localization of the
 * unit suffixes is a backlog item.
 */
export function formatHoursMinutes(totalSeconds: number): string {
    const seconds = Math.max(0, Math.round(totalSeconds));
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (hours > 0 && minutes > 0) {
        return `${hours}h ${minutes}m`;
    }
    if (hours > 0) {
        return `${hours}h`;
    }
    return `${minutes}m`;
}
