//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { ChannelType } from "@jellyfin/sdk/lib/generated-client/models/channel-type";
import { LocationType } from "@jellyfin/sdk/lib/generated-client/models/location-type";
import type { UserItemDataDto } from "@jellyfin/sdk/lib/generated-client/models/user-item-data-dto";
import { describe, expect, it } from "vitest";
import {
    displayTitle,
    episodeLocator,
    isFavorite,
    isLiveStream,
    isMissing,
    isPlayable,
    isUnaired,
    itemMetadataLabels,
    playButtonLabel,
    playedFraction,
    premiereYear,
    progressLabel,
    runtimeLabel,
    seasonEpisodeLabel,
    seriesPlayTarget,
    uniqueItems,
} from "../src/jellyfin/itemHelpers";
import { formatClock, formatHoursMinutes, secondsToTicks } from "../src/jellyfin/ticks";

describe("ticks / formatting", () => {
    it("formats hours and minutes", () => {
        expect(formatHoursMinutes(0)).toBe("0m");
        expect(formatHoursMinutes(45 * 60)).toBe("45m");
        expect(formatHoursMinutes(3600 + 23 * 60)).toBe("1h 23m");
        expect(formatHoursMinutes(2 * 3600)).toBe("2h");
    });

    it("formats a player clock, with hours when the reference needs them", () => {
        expect(formatClock(0)).toBe("0:00");
        expect(formatClock(245.9)).toBe("4:05");
        expect(formatClock(3723)).toBe("1:02:03");
        expect(formatClock(65, 2 * 3600)).toBe("0:01:05");
        expect(formatClock(-3)).toBe("0:00");
    });
});

describe("BaseItemDto helpers", () => {
    it("displayTitle falls back to Unknown", () => {
        expect(displayTitle({ Name: "The Matrix" })).toBe("The Matrix");
        expect(displayTitle({})).toBe("Unknown");
    });

    it("episode + season labels", () => {
        const episode: BaseItemDto = { Type: BaseItemKind.Episode, IndexNumber: 4, ParentIndexNumber: 2 };
        expect(episodeLocator(episode)).toBe("Episode 4");
        expect(seasonEpisodeLabel(episode)).toBe("S2 E4");
        expect(episodeLocator({})).toBeUndefined();
        expect(seasonEpisodeLabel({ IndexNumber: 4 })).toBeUndefined();
    });

    it("isLiveStream / isMissing / isUnaired", () => {
        expect(isLiveStream({ ChannelType: ChannelType.Tv })).toBe(true);
        expect(isLiveStream({})).toBe(false);
        expect(isMissing({ LocationType: LocationType.Virtual })).toBe(true);
        const future = new Date(Date.now() + 86_400_000).toISOString();
        const past = new Date(Date.now() - 86_400_000).toISOString();
        expect(isUnaired({ PremiereDate: future })).toBe(true);
        expect(isUnaired({ PremiereDate: past })).toBe(false);
        expect(isUnaired({})).toBe(false);
    });

    it("isPlayable: movies yes, series no, missing no", () => {
        expect(isPlayable({ Type: BaseItemKind.Movie })).toBe(true);
        expect(isPlayable({ Type: BaseItemKind.Series })).toBe(false);
        expect(isPlayable({ Type: BaseItemKind.Movie, LocationType: LocationType.Virtual })).toBe(false);
    });

    it("playedFraction prefers server percentage then position/runtime", () => {
        expect(playedFraction({ UserData: { Key: "k", PlayedPercentage: 50 } })).toBeCloseTo(0.5);
        expect(
            playedFraction({ RunTimeTicks: 1000, UserData: { Key: "k", PlaybackPositionTicks: 250 } }),
        ).toBeCloseTo(0.25);
        expect(playedFraction({})).toBeUndefined();
    });

    it("runtime and progress labels", () => {
        const runtime = secondsToTicks(90 * 60); // 1h30m
        const position = secondsToTicks(30 * 60); // 30m in → 1h remaining
        expect(runtimeLabel({ RunTimeTicks: runtime })).toBe("1h 30m");
        expect(progressLabel({ RunTimeTicks: runtime, UserData: { Key: "k", PlaybackPositionTicks: position } })).toBe(
            "1h",
        );
        expect(progressLabel({ RunTimeTicks: runtime })).toBeUndefined();
    });

    it("premiereYear", () => {
        expect(premiereYear({ PremiereDate: "1999-03-31T00:00:00.000Z" })).toBe("1999");
        expect(premiereYear({})).toBeUndefined();
    });
});

describe("item-detail helpers", () => {
    const userData = (data: Omit<UserItemDataDto, "Key">): UserItemDataDto => ({ Key: "k", ...data });
    const episode = (id: string, extra: BaseItemDto = {}): BaseItemDto => ({
        Id: id,
        Type: BaseItemKind.Episode,
        ParentIndexNumber: 1,
        IndexNumber: 3,
        ...extra,
    });

    it("isFavorite reads user data", () => {
        expect(isFavorite({ UserData: userData({ IsFavorite: true }) })).toBe(true);
        expect(isFavorite({})).toBe(false);
    });

    it("seriesPlayTarget prefers next-up, skipping missing episodes", () => {
        const nextUp = episode("next");
        const resume = episode("resume");
        const first = episode("first");
        expect(seriesPlayTarget({ nextUp, resume, firstAvailable: first })?.Id).toBe("next");
        const missing = episode("missing", { LocationType: LocationType.Virtual });
        expect(seriesPlayTarget({ nextUp: missing, resume, firstAvailable: first })?.Id).toBe(
            "resume",
        );
        expect(seriesPlayTarget({ firstAvailable: first })?.Id).toBe("first");
        expect(seriesPlayTarget({})).toBeUndefined();
    });

    it("playButtonLabel reflects progress and episode locator", () => {
        expect(playButtonLabel({ Type: BaseItemKind.Movie })).toBe("Play");
        expect(
            playButtonLabel({ Type: BaseItemKind.Movie, UserData: userData({ PlaybackPositionTicks: 10 }) }),
        ).toBe("Resume");
        expect(playButtonLabel(episode("e"))).toBe("Play S1 E3");
        expect(playButtonLabel(episode("e", { UserData: userData({ PlaybackPositionTicks: 5 }) }))).toBe(
            "Resume S1 E3",
        );
    });
});

describe("itemMetadataLabels", () => {
    it("lists year, rating, runtime and score for a movie", () => {
        expect(
            itemMetadataLabels({
                Type: BaseItemKind.Movie,
                ProductionYear: 2019,
                OfficialRating: "PG-13",
                RunTimeTicks: secondsToTicks(112 * 60),
                CommunityRating: 7.84,
            }),
        ).toEqual(["2019", "PG-13", formatHoursMinutes(112 * 60), "★ 7.8"]);
    });

    it("shows a year range for series and omits runtime", () => {
        expect(
            itemMetadataLabels({
                Type: BaseItemKind.Series,
                ProductionYear: 2008,
                EndDate: "2013-09-29T00:00:00.000Z",
                RunTimeTicks: secondsToTicks(2700),
            }),
        ).toEqual(["2008–2013"]);
        expect(
            itemMetadataLabels({ Type: BaseItemKind.Series, ProductionYear: 2022, Status: "Continuing" }),
        ).toEqual(["2022–"]);
    });
});

describe("uniqueItems", () => {
    it("drops repeated ids, keeping first occurrences in order", () => {
        const items = [{ Id: "a", Name: "1" }, { Id: "b" }, { Id: "a", Name: "2" }, { Id: "c" }];
        expect(uniqueItems(items)).toEqual([{ Id: "a", Name: "1" }, { Id: "b" }, { Id: "c" }]);
    });

    it("keeps items without an id", () => {
        expect(uniqueItems([{ Name: "x" }, { Name: "y" }])).toHaveLength(2);
    });
});
