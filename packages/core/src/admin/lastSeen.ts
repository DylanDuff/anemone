//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const WEEK = 7 * DAY;

function ago(count: number, unit: string): string {
    return `${count} ${unit}${count === 1 ? "" : "s"} ago`;
}

/**
 * When something last happened, relative to `now` (Swiftfin's `.lastSeen` format): "Just now",
 * "5 minutes ago", "3 hours ago", "2 days ago", then the date. Hand-rolled because Hermes lacks
 * `Intl.RelativeTimeFormat`. `undefined` for a missing or unparseable date.
 */
export function formatLastSeen(isoDate: string | null | undefined, now = Date.now()): string | undefined {
    const time = isoDate ? Date.parse(isoDate) : NaN;
    if (Number.isNaN(time)) {
        return undefined;
    }
    const elapsed = Math.max(0, now - time);
    if (elapsed < MINUTE) {
        return "Just now";
    }
    if (elapsed < HOUR) {
        return ago(Math.floor(elapsed / MINUTE), "minute");
    }
    if (elapsed < DAY) {
        return ago(Math.floor(elapsed / HOUR), "hour");
    }
    if (elapsed < WEEK) {
        return ago(Math.floor(elapsed / DAY), "day");
    }
    return new Date(time).toLocaleDateString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
    });
}

/** A date and time in full, for detail pages ("27 Sep 2026, 9:41 pm"). */
export function formatDateTime(isoDate: string | null | undefined): string | undefined {
    const time = isoDate ? Date.parse(isoDate) : NaN;
    if (Number.isNaN(time)) {
        return undefined;
    }
    return new Date(time).toLocaleString(undefined, {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
    });
}
