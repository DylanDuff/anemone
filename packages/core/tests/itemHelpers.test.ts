//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { BaseItemKind } from "@jellyfin/sdk/lib/generated-client/models/base-item-kind";
import { ChannelType } from "@jellyfin/sdk/lib/generated-client/models/channel-type";
import { LocationType } from "@jellyfin/sdk/lib/generated-client/models/location-type";
import { describe, expect, it } from "vitest";
import {
    displayTitle,
    episodeLocator,
    isLiveStream,
    isMissing,
    isPlayable,
    isUnaired,
    playedFraction,
    premiereYear,
    progressLabel,
    runtimeLabel,
    seasonEpisodeLabel,
} from "../src/jellyfin/itemHelpers";
import { formatHoursMinutes, secondsToTicks } from "../src/jellyfin/ticks";

describe("ticks / formatting", () => {
    it("formats hours and minutes", () => {
        expect(formatHoursMinutes(0)).toBe("0m");
        expect(formatHoursMinutes(45 * 60)).toBe("45m");
        expect(formatHoursMinutes(3600 + 23 * 60)).toBe("1h 23m");
        expect(formatHoursMinutes(2 * 3600)).toBe("2h");
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
