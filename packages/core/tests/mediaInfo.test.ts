//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import type { MediaStream } from "@jellyfin/sdk/lib/generated-client/models/media-stream";
import { MediaStreamType } from "@jellyfin/sdk/lib/generated-client/models/media-stream-type";
import { VideoRangeType } from "@jellyfin/sdk/lib/generated-client/models/video-range-type";
import { describe, expect, it } from "vitest";
import {
    audioChannelsLabel,
    codecLabel,
    mediaAttributeBadges,
    mediaSourceSummary,
    videoRangeLabel,
    videoResolutionLabel,
} from "../src/jellyfin/mediaInfo";

const video4K: MediaStream = {
    Type: MediaStreamType.Video,
    Width: 3840,
    Height: 1600, // letterboxed — still 4K
    Codec: "hevc",
    VideoRangeType: VideoRangeType.DoviWithHdr10,
};

const audioAtmos: MediaStream = {
    Type: MediaStreamType.Audio,
    Codec: "truehd",
    Channels: 8,
    Language: "eng",
    IsDefault: true,
};

const audioCommentary: MediaStream = {
    Type: MediaStreamType.Audio,
    Codec: "aac",
    Channels: 2,
    DisplayTitle: "Commentary - Stereo",
};

const subtitle: MediaStream = { Type: MediaStreamType.Subtitle, DisplayTitle: "English - SRT" };

describe("stream labels", () => {
    it("classifies resolution by width", () => {
        expect(videoResolutionLabel(video4K)).toBe("4K");
        expect(videoResolutionLabel({ Width: 1920, Height: 800 })).toBe("1080p");
        expect(videoResolutionLabel({ Width: 1280 })).toBe("720p");
        expect(videoResolutionLabel({ Width: 640 })).toBe("SD");
        expect(videoResolutionLabel({})).toBeUndefined();
    });

    it("names dynamic range, hiding SDR", () => {
        expect(videoRangeLabel(video4K)).toBe("Dolby Vision");
        expect(videoRangeLabel({ VideoRangeType: VideoRangeType.Hdr10Plus })).toBe("HDR10+");
        expect(videoRangeLabel({ VideoRangeType: VideoRangeType.Hdr10 })).toBe("HDR10");
        expect(videoRangeLabel({ VideoRangeType: VideoRangeType.Sdr })).toBeUndefined();
    });

    it("labels channels and codecs", () => {
        expect(audioChannelsLabel(2)).toBe("Stereo");
        expect(audioChannelsLabel(6)).toBe("5.1");
        expect(audioChannelsLabel(3)).toBe("3ch");
        expect(audioChannelsLabel(undefined)).toBeUndefined();
        expect(codecLabel("TRUEHD")).toBe("TrueHD");
        expect(codecLabel("xyz")).toBe("XYZ");
    });
});

describe("mediaSourceSummary", () => {
    it("summarises video, audio and subtitle tracks", () => {
        const summary = mediaSourceSummary({
            Name: "Director's Cut",
            Container: "mkv",
            MediaStreams: [video4K, audioAtmos, audioCommentary, subtitle],
        });
        expect(summary).toEqual({
            name: "Director's Cut",
            container: "MKV",
            video: "4K HEVC Dolby Vision",
            audio: ["eng TrueHD 7.1", "Commentary - Stereo"],
            subtitles: ["English - SRT"],
        });
    });
});

describe("mediaAttributeBadges", () => {
    it("uses the first media source's default tracks", () => {
        const badges = mediaAttributeBadges({
            MediaSources: [{ MediaStreams: [video4K, audioCommentary, audioAtmos, subtitle] }],
        });
        expect(badges).toEqual(["4K", "Dolby Vision", "7.1", "CC"]);
    });

    it("is empty without stream info", () => {
        expect(mediaAttributeBadges({})).toEqual([]);
    });
});
