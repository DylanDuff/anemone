//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// Pure display/derivation helpers over `BaseItemDto`, ported from Swiftfin's `BaseItemDto`
// extensions. UI- and media-player-specific helpers (AVKit metadata, now-playing) are omitted;
// see the backlog. Localization of labels is a backlog item (currently English).
//

import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { ChannelType } from "@jellyfin/sdk/lib/generated-client/models/channel-type";
import { LocationType } from "@jellyfin/sdk/lib/generated-client/models/location-type";
import { formatHoursMinutes, ticksToSeconds } from "./ticks";

/** The title to show for an item (Swiftfin `displayTitle`). */
export function displayTitle(item: BaseItemDto): string {
    return item.Name ?? "Unknown";
}

/** "Episode N" locator for an episode (Swiftfin `episodeLocator`). */
export function episodeLocator(item: BaseItemDto): string | undefined {
    return item.IndexNumber == null ? undefined : `Episode ${item.IndexNumber}`;
}

/** "S{season} E{episode}" label when both are present (Swiftfin `seasonEpisodeLabel`). */
export function seasonEpisodeLabel(item: BaseItemDto): string | undefined {
    if (item.ParentIndexNumber == null || item.IndexNumber == null) {
        return undefined;
    }
    return `S${item.ParentIndexNumber} E${item.IndexNumber}`;
}

/** Whether the item streams from a live source (Swiftfin `isLiveStream`). */
export function isLiveStream(item: BaseItemDto): boolean {
    return item.ChannelType === ChannelType.Tv;
}

/** An item is "missing" when it has no physical media (Swiftfin `isMissing`). */
export function isMissing(item: BaseItemDto): boolean {
    return item.LocationType === LocationType.Virtual;
}

/** An item is "unaired" when its premiere date is in the future (Swiftfin `isUnaired`). */
export function isUnaired(item: BaseItemDto, now: Date = new Date()): boolean {
    if (!item.PremiereDate) {
        return false;
    }
    return new Date(item.PremiereDate).getTime() > now.getTime();
}

/**
 * Whether the item has its own directly-playable content (Swiftfin `isPlayable`). A series is not
 * playable (its episodes are); missing items are never playable.
 */
export function isPlayable(item: BaseItemDto): boolean {
    if (isMissing(item)) {
        return false;
    }
    return item.Type !== BaseItemKind.Series;
}

/** Whether the item has been fully played. */
export function isPlayed(item: BaseItemDto): boolean {
    return item.UserData?.Played ?? false;
}

/** Playback resume position in ticks, if any. */
export function playbackPositionTicks(item: BaseItemDto): number | undefined {
    return item.UserData?.PlaybackPositionTicks ?? undefined;
}

/**
 * Progress through the item as a fraction 0…1, preferring the server's `PlayedPercentage` and
 * falling back to position/runtime. Returns `undefined` when there is no meaningful progress.
 */
export function playedFraction(item: BaseItemDto): number | undefined {
    const percent = item.UserData?.PlayedPercentage;
    if (percent != null) {
        return Math.min(1, Math.max(0, percent / 100));
    }
    const position = item.UserData?.PlaybackPositionTicks;
    const runtime = item.RunTimeTicks;
    if (position && runtime) {
        return Math.min(1, Math.max(0, position / runtime));
    }
    return undefined;
}

/** Runtime in seconds, if known. */
export function runtimeSeconds(item: BaseItemDto): number | undefined {
    return item.RunTimeTicks == null ? undefined : ticksToSeconds(item.RunTimeTicks);
}

/** Abbreviated runtime label (e.g. "1h 23m"), Swiftfin `runTimeLabel`. */
export function runtimeLabel(item: BaseItemDto): string | undefined {
    const seconds = runtimeSeconds(item);
    return seconds == null ? undefined : formatHoursMinutes(seconds);
}

/** Remaining-time label while partway through an item (e.g. "34m"), Swiftfin `progressLabel`. */
export function progressLabel(item: BaseItemDto): string | undefined {
    const position = item.UserData?.PlaybackPositionTicks;
    const total = item.RunTimeTicks;
    if (!position || !total) {
        return undefined;
    }
    return formatHoursMinutes(ticksToSeconds(total - position));
}

/** Four-digit premiere year, if known (Swiftfin `premiereDateYear`). */
export function premiereYear(item: BaseItemDto): string | undefined {
    if (!item.PremiereDate) {
        return undefined;
    }
    return String(new Date(item.PremiereDate).getFullYear());
}
