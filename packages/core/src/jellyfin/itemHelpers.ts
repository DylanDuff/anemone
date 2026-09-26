//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// Pure display/derivation helpers over `BaseItemDto`, ported from Swiftfin's `BaseItemDto`
// extensions. UI- and media-player-specific helpers (AVKit metadata, now-playing) are omitted;
// see the backlog. Localization of labels is a backlog item (currently English).
//

import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import type { BaseItemPerson } from "@jellyfin/sdk/lib/generated-client/models/base-item-person";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { ChannelType } from "@jellyfin/sdk/lib/generated-client/models/channel-type";
import { LocationType } from "@jellyfin/sdk/lib/generated-client/models/location-type";
import { formatHoursMinutes, ticksToSeconds } from "./ticks";

/**
 * Drop repeated items (same `Id`), keeping the first occurrence and the original order. The server
 * can return an item twice — e.g. "latest" across libraries when it belongs to two views, or
 * offset paging over a sort with ties — and duplicates break list rendering (React keys).
 */
/**
 * A person item (e.g. a people-search result) in the cast-entry shape (`BaseItemPerson`), so both
 * render through the same person card and image helpers.
 */
export function personFromItem(item: BaseItemDto): BaseItemPerson {
    return {
        Id: item.Id ?? undefined,
        Name: item.Name,
        PrimaryImageTag: item.ImageTags?.Primary,
        ImageBlurHashes: item.ImageBlurHashes,
    };
}

export function uniqueItems<Item extends BaseItemDto>(items: readonly Item[]): Item[] {
    const seen = new Set<string>();
    return items.filter((item) => {
        if (!item.Id) {
            return true;
        }
        if (seen.has(item.Id)) {
            return false;
        }
        seen.add(item.Id);
        return true;
    });
}

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

/** Whether the user has favorited the item. */
export function isFavorite(item: BaseItemDto): boolean {
    return item.UserData?.IsFavorite ?? false;
}

/** Candidate episodes for a series' Play button, fetched in parallel. */
export interface SeriesPlayCandidates {
    readonly nextUp?: BaseItemDto;
    readonly resume?: BaseItemDto;
    readonly firstAvailable?: BaseItemDto;
}

/**
 * Pick the episode a series' Play button should start (Swiftfin `SeriesItemViewModel`): next-up
 * (unless missing), then an in-progress episode, then the first available episode.
 */
export function seriesPlayTarget(candidates: SeriesPlayCandidates): BaseItemDto | undefined {
    const nextUp = candidates.nextUp && !isMissing(candidates.nextUp) ? candidates.nextUp : undefined;
    return nextUp ?? candidates.resume ?? candidates.firstAvailable;
}

/** "Play", "Resume", "Play S1 E3", "Resume S2 E1" — for the item a Play button will start. */
export function playButtonLabel(item: BaseItemDto): string {
    const verb = (playbackPositionTicks(item) ?? 0) > 0 ? "Resume" : "Play";
    const locator = item.Type === BaseItemKind.Episode ? seasonEpisodeLabel(item) : undefined;
    return locator ? `${verb} ${locator}` : verb;
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

/** "2019", or for a series that has ended its run: "2008–2013". Continuing series show "2022". */
function yearLabel(item: BaseItemDto): string | undefined {
    const year = item.ProductionYear != null ? String(item.ProductionYear) : premiereYear(item);
    if (!year || item.Type !== BaseItemKind.Series) {
        return year;
    }
    const endYear = item.EndDate ? String(new Date(item.EndDate).getFullYear()) : undefined;
    if (endYear && endYear !== year) {
        return `${year}–${endYear}`;
    }
    return year;
}

/**
 * The short facts shown beside a title — year (or year range for an ended series), parental
 * rating, runtime, and community rating: `["2019", "PG-13", "1h 52m", "★ 7.8"]`.
 */
export function itemMetadataLabels(item: BaseItemDto): string[] {
    return [
        yearLabel(item),
        item.OfficialRating ?? undefined,
        item.Type === BaseItemKind.Series ? undefined : runtimeLabel(item),
        item.CommunityRating != null ? `★ ${item.CommunityRating.toFixed(1)}` : undefined,
    ].filter((label): label is string => Boolean(label));
}

/** An ISO date as a long, localised date ("2 September 1964" / "September 2, 1964"). */
export function formatLongDate(isoDate: string | null | undefined): string | undefined {
    if (!isoDate) {
        return undefined;
    }
    return new Date(isoDate).toLocaleDateString(undefined, {
        year: "numeric",
        month: "long",
        day: "numeric",
    });
}

/**
 * A person's birth and death lines ("Born 2 September 1964 in Beirut, Lebanon", "Died …"), from the
 * dates and first production location Jellyfin stores on person items.
 */
export function personLifeLabels(item: BaseItemDto): string[] {
    const labels: string[] = [];
    const born = formatLongDate(item.PremiereDate);
    const place = item.ProductionLocations?.[0];
    if (born) {
        labels.push(place ? `Born ${born} in ${place}` : `Born ${born}`);
    } else if (place) {
        labels.push(`Born in ${place}`);
    }
    const died = formatLongDate(item.EndDate);
    if (died) {
        labels.push(`Died ${died}`);
    }
    return labels;
}

/** Four-digit premiere year, if known (Swiftfin `premiereDateYear`). */
export function premiereYear(item: BaseItemDto): string | undefined {
    if (!item.PremiereDate) {
        return undefined;
    }
    return String(new Date(item.PremiereDate).getFullYear());
}
