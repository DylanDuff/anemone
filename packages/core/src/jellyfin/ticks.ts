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
