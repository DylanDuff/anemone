//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { MediaSourceInfo } from "@jellyfin/sdk/lib/generated-client/models/media-source-info";
import type { PlaybackInfoResponse } from "@jellyfin/sdk/lib/generated-client/models/playback-info-response";

// Capture what the SDK is called with, and control its responses.
const calls: { playbackInfo: unknown[]; session: Array<[string, unknown]> } = {
    playbackInfo: [],
    session: [],
};
let playbackInfoResponse: PlaybackInfoResponse = {};
let sessionFailure: Error | null = null;

function sessionCall(name: string) {
    return async (params: unknown) => {
        calls.session.push([name, params]);
        if (sessionFailure) {
            throw sessionFailure;
        }
        return { data: undefined };
    };
}

vi.mock("../src/jellyfin/api", () => ({
    getMediaInfoApi: () => ({
        getPostedPlaybackInfo: async (params: unknown) => {
            calls.playbackInfo.push(params);
            return { data: playbackInfoResponse };
        },
    }),
    getSessionApi: () => ({
        reportPlaybackStart: sessionCall("start"),
        reportPlaybackProgress: sessionCall("progress"),
        reportPlaybackStopped: sessionCall("stop"),
    }),
}));

import {
    buildDeviceProfile,
    createPlaybackViewModel,
    type PlayerCapabilities,
    PlaybackReporter,
    resolvePlayback,
    selectTrackLocally,
    SUBTITLES_OFF,
    type Api,
} from "../src";

const api = { basePath: "https://jf.example/", accessToken: "token" } as unknown as Api;
const ctx = { api, userID: "user1" };

const capabilities: PlayerCapabilities = {
    name: "Test",
    directPlay: [{ containers: ["mp4", "mkv"], videoCodecs: ["h264", "hevc"], audioCodecs: ["aac"] }],
    transcode: { container: "mp4", videoCodecs: ["hevc", "h264"], audioCodecs: ["aac"] },
    videoRanges: [],
    maxAudioChannels: 6,
    selectsEmbeddedAudio: true,
    sideloadsSubtitlesWithHls: true,
};

/** A two-audio, three-subtitle source; subtitle deliveries as the server would assign them. */
function mediaSource(overrides: Partial<MediaSourceInfo> = {}): MediaSourceInfo {
    return {
        Id: "source1",
        ETag: "etag1",
        SupportsDirectPlay: true,
        RunTimeTicks: 600_000_000,
        DefaultAudioStreamIndex: 1,
        DefaultSubtitleStreamIndex: 3,
        MediaStreams: [
            { Index: 0, Type: "Video", Codec: "h264" },
            { Index: 1, Type: "Audio", Codec: "aac", Language: "eng", DisplayTitle: "English" },
            { Index: 2, Type: "Audio", Codec: "aac", Language: "jpn", DisplayTitle: "Japanese" },
            {
                Index: 3,
                Type: "Subtitle",
                Codec: "subrip",
                Language: "eng",
                DisplayTitle: "English SRT",
                DeliveryMethod: "External",
                DeliveryUrl: "/Videos/item1/source1/Subtitles/3/0/Stream.vtt",
            },
            {
                Index: 4,
                Type: "Subtitle",
                Codec: "ass",
                Language: "jpn",
                DisplayTitle: "Japanese ASS",
                DeliveryMethod: "External",
                DeliveryUrl: "/Videos/item1/source1/Subtitles/4/0/Stream.vtt?ApiKey=token",
            },
            {
                Index: 5,
                Type: "Subtitle",
                Codec: "PGSSUB",
                DisplayTitle: "English PGS",
                DeliveryMethod: "Encode",
            },
        ],
        ...overrides,
    } as MediaSourceInfo;
}

const transcodingURL = "/videos/item1/master.m3u8?MediaSourceId=source1&ApiKey=token";

beforeEach(() => {
    calls.playbackInfo = [];
    calls.session = [];
    sessionFailure = null;
    playbackInfoResponse = { PlaySessionId: "session1", MediaSources: [mediaSource()] };
});

describe("buildDeviceProfile", () => {
    it("maps direct play formats and the HLS transcode target", () => {
        const profile = buildDeviceProfile(capabilities, 20_000_000);

        expect(profile.MaxStreamingBitrate).toBe(20_000_000);
        expect(profile.DirectPlayProfiles).toEqual([
            { Type: "Video", Container: "mp4,mkv", VideoCodec: "h264,hevc", AudioCodec: "aac" },
        ]);
        expect(profile.TranscodingProfiles?.[0]).toMatchObject({
            Protocol: "hls",
            Container: "mp4",
            VideoCodec: "hevc,h264",
            MaxAudioChannels: "6",
            EnableSubtitlesInManifest: false,
        });
    });

    it("puts subtitles in the HLS manifest first for engines that can't sideload beside HLS", () => {
        const sideloading = buildDeviceProfile(capabilities).SubtitleProfiles ?? [];
        const manifest =
            buildDeviceProfile({ ...capabilities, sideloadsSubtitlesWithHls: false })
                .SubtitleProfiles ?? [];

        expect(sideloading[0]).toEqual({ Format: "vtt", Method: "External" });
        expect(sideloading.some((profile) => profile.Method === "Hls")).toBe(false);
        expect(manifest.slice(0, 2)).toEqual([
            { Format: "vtt", Method: "Hls" },
            { Format: "vtt", Method: "External" },
        ]);
        expect(manifest.find((profile) => profile.Format === "pgssub")?.Method).toBe("Encode");
    });

    it("requires the default audio track when the engine can't switch embedded audio", () => {
        const conditionsFor = (selectsEmbeddedAudio: boolean) =>
            buildDeviceProfile({ ...capabilities, selectsEmbeddedAudio })
                .CodecProfiles?.find((profile) => profile.Type === "VideoAudio")
                ?.Conditions?.map((condition) => condition.Property);

        expect(conditionsFor(true)).toEqual(["AudioChannels"]);
        expect(conditionsFor(false)).toEqual(["AudioChannels", "IsSecondaryAudio"]);
    });

    it("caps resolution for every codec when the decoder has a maximum size", () => {
        const profile = buildDeviceProfile({
            ...capabilities,
            maxVideoSize: { width: 1920, height: 1080 },
        });
        const sizeProfile = profile.CodecProfiles?.find(
            (candidate) => candidate.Type === "Video" && !candidate.Codec,
        );

        expect(sizeProfile?.Conditions?.map((condition) => condition.Value)).toEqual([
            "1920",
            "1080",
        ]);
    });

    it("allows the engine's HDR ranges on HEVC but keeps H.264 SDR", () => {
        const profile = buildDeviceProfile({ ...capabilities, videoRanges: ["HDR10"] });
        const rangeFor = (codec: string) =>
            profile.CodecProfiles?.find((candidate) => candidate.Codec === codec)
                ?.Conditions?.find((condition) => condition.Property === "VideoRangeType")?.Value;

        expect(rangeFor("hevc")).toBe("SDR|DOVIWithSDR|HDR10");
        expect(rangeFor("h264")).toBe("SDR|DOVIWithSDR");
    });
});

describe("resolvePlayback", () => {
    it("posts the device profile and builds an authenticated direct play URL", async () => {
        const source = await resolvePlayback(ctx, {
            itemID: "item1",
            capabilities,
            startTicks: 50,
        });

        expect(calls.playbackInfo[0]).toMatchObject({
            itemId: "item1",
            playbackInfoDto: {
                UserId: "user1",
                StartTimeTicks: 50,
                DeviceProfile: { Name: "Test" },
            },
        });
        expect(source.method).toBe("DirectPlay");
        expect(source.isHls).toBe(false);
        expect(source.url).toBe(
            "https://jf.example/Videos/item1/stream?static=true&playSessionId=session1" +
                "&mediaSourceId=source1&tag=etag1&ApiKey=token",
        );
        expect(source.startTicks).toBe(50);
    });

    it("selects the server's default tracks and resolves their delivery", async () => {
        const source = await resolvePlayback(ctx, { itemID: "item1", capabilities });

        expect(source.audioTracks.map((track) => track.title)).toEqual(["English", "Japanese"]);
        expect(source.subtitleTracks.map((track) => track.index)).toEqual([3, 4, 5]);
        expect(source.audioStreamIndex).toBe(1);
        expect(source.audio).toEqual({ kind: "embedded", position: 0 });
        expect(source.subtitle).toEqual({ kind: "external", index: 3 });
        expect(source.externalSubtitles).toEqual([
            {
                index: 3,
                url: "https://jf.example/Videos/item1/source1/Subtitles/3/0/Stream.vtt?ApiKey=token",
                title: "English SRT",
                language: "eng",
            },
            {
                index: 4,
                url: "https://jf.example/Videos/item1/source1/Subtitles/4/0/Stream.vtt?ApiKey=token",
                title: "Japanese ASS",
                language: "jpn",
            },
        ]);
    });

    it("sideloads nothing beside HLS for engines that can't", async () => {
        playbackInfoResponse = {
            PlaySessionId: "session1",
            MediaSources: [mediaSource({ SupportsDirectPlay: false, TranscodingUrl: transcodingURL })],
        };

        const source = await resolvePlayback(ctx, {
            itemID: "item1",
            capabilities: { ...capabilities, sideloadsSubtitlesWithHls: false },
        });

        expect(source.externalSubtitles).toEqual([]);
        expect(source.subtitle).toEqual({ kind: "none" });
    });

    it("plays the transcoding URL as HLS with only the selected audio", async () => {
        playbackInfoResponse = {
            PlaySessionId: "session1",
            MediaSources: [
                mediaSource({
                    SupportsDirectPlay: false,
                    TranscodingUrl: transcodingURL,
                    TranscodingSubProtocol: "hls",
                }),
            ],
        };

        const source = await resolvePlayback(ctx, {
            itemID: "item1",
            capabilities,
            audioStreamIndex: 2,
            subtitleStreamIndex: SUBTITLES_OFF,
        });

        expect(source.method).toBe("Transcode");
        expect(source.isHls).toBe(true);
        // The server's URL already carries the token; it isn't added twice.
        expect(source.url).toBe(`https://jf.example${transcodingURL}`);
        expect(source.audio).toEqual({ kind: "default" });
        expect(source.subtitle).toEqual({ kind: "none" });
    });

    it("picks the requested media source", async () => {
        playbackInfoResponse = {
            PlaySessionId: "session1",
            MediaSources: [mediaSource(), mediaSource({ Id: "source2" })],
        };

        const source = await resolvePlayback(ctx, {
            itemID: "item1",
            capabilities,
            mediaSourceID: "source2",
        });

        expect(source.mediaSourceID).toBe("source2");
    });

    it("surfaces the server's refusal as a readable error", async () => {
        playbackInfoResponse = { ErrorCode: "NoCompatibleStream" };

        await expect(resolvePlayback(ctx, { itemID: "item1", capabilities })).rejects.toThrow(
            "The server couldn't find a playable stream.",
        );
    });
});

describe("selectTrackLocally", () => {
    it("switches embedded audio in place while direct playing", async () => {
        const source = await resolvePlayback(ctx, { itemID: "item1", capabilities });

        const switched = selectTrackLocally(source, { kind: "audio", index: 2 }, capabilities);

        expect(switched?.audioStreamIndex).toBe(2);
        expect(switched?.audio).toEqual({ kind: "embedded", position: 1 });
        expect(switched?.playSessionID).toBe(source.playSessionID);
    });

    it("needs a new stream to switch audio when the engine can't", async () => {
        const limited = { ...capabilities, selectsEmbeddedAudio: false };
        const source = await resolvePlayback(ctx, { itemID: "item1", capabilities: limited });

        expect(selectTrackLocally(source, { kind: "audio", index: 2 }, limited)).toBe(
            undefined,
        );
    });

    it("swaps external subtitles in place, but not into a burn-in", async () => {
        const source = await resolvePlayback(ctx, { itemID: "item1", capabilities });

        const swapped = selectTrackLocally(source, { kind: "subtitle", index: 4 }, capabilities);
        const off = selectTrackLocally(
            source,
            { kind: "subtitle", index: SUBTITLES_OFF },
            capabilities,
        );
        const burnIn = selectTrackLocally(source, { kind: "subtitle", index: 5 }, capabilities);

        expect(swapped?.subtitle).toEqual({ kind: "external", index: 4 });
        expect(off?.subtitle).toEqual({ kind: "none" });
        expect(burnIn).toBe(undefined);
    });

    it("needs a new stream to leave burned-in subtitles", async () => {
        playbackInfoResponse = {
            PlaySessionId: "session1",
            MediaSources: [mediaSource({ SupportsDirectPlay: false, TranscodingUrl: transcodingURL })],
        };
        const source = await resolvePlayback(ctx, {
            itemID: "item1",
            capabilities,
            subtitleStreamIndex: 5,
        });

        expect(source.subtitle).toEqual({ kind: "burnedIn" });
        expect(
            selectTrackLocally(source, { kind: "subtitle", index: 3 }, capabilities),
        ).toBe(undefined);
    });

    it("won't sideload beside HLS for engines that can't", async () => {
        playbackInfoResponse = {
            PlaySessionId: "session1",
            MediaSources: [mediaSource({ SupportsDirectPlay: false, TranscodingUrl: transcodingURL })],
        };
        const manifestOnly = { ...capabilities, sideloadsSubtitlesWithHls: false };
        const source = await resolvePlayback(ctx, {
            itemID: "item1",
            capabilities: manifestOnly,
            subtitleStreamIndex: SUBTITLES_OFF,
        });

        expect(
            selectTrackLocally(source, { kind: "subtitle", index: 3 }, manifestOnly),
        ).toBe(undefined);
    });
});

describe("PlaybackReporter", () => {
    async function startedReporter() {
        const source = await resolvePlayback(ctx, { itemID: "item1", capabilities });
        let time = 0;
        const reporter = new PlaybackReporter(api, source, {
            intervalMs: 10_000,
            now: () => time,
        });
        return {
            source,
            reporter,
            advance: (ms: number) => {
                time += ms;
            },
        };
    }

    it("ignores progress before start", async () => {
        const { reporter } = await startedReporter();

        await reporter.progressed({ positionTicks: 1, isPaused: false });

        expect(calls.session).toEqual([]);
    });

    it("throttles routine progress to one report per interval", async () => {
        const { reporter, advance } = await startedReporter();

        await reporter.started({ positionTicks: 0, isPaused: false });
        advance(5_000);
        await reporter.progressed({ positionTicks: 5, isPaused: false });
        advance(5_000);
        await reporter.progressed({ positionTicks: 10, isPaused: false });

        expect(calls.session.map(([name]) => name)).toEqual(["start", "progress"]);
        expect(calls.session[0]?.[1]).toMatchObject({
            playbackStartInfo: {
                ItemId: "item1",
                PlaySessionId: "session1",
                PlayMethod: "DirectPlay",
                AudioStreamIndex: 1,
                SubtitleStreamIndex: 3,
            },
        });
        expect(calls.session[1]?.[1]).toMatchObject({
            playbackProgressInfo: { PositionTicks: 10 },
        });
    });

    it("reports changes immediately, with switched tracks", async () => {
        const { reporter, source } = await startedReporter();

        await reporter.started({ positionTicks: 0, isPaused: false });
        await reporter.changed({ positionTicks: 3, isPaused: true }, {
            ...source,
            subtitleStreamIndex: SUBTITLES_OFF,
        });

        expect(calls.session[1]?.[1]).toMatchObject({
            playbackProgressInfo: { PositionTicks: 3, IsPaused: true, SubtitleStreamIndex: -1 },
        });
    });

    it("stops only once", async () => {
        const { reporter } = await startedReporter();

        await reporter.started({ positionTicks: 0, isPaused: false });
        await reporter.stopped({ positionTicks: 42, isPaused: false });
        await reporter.stopped({ positionTicks: 43, isPaused: false });
        await reporter.progressed({ positionTicks: 44, isPaused: false });

        expect(calls.session.map(([name]) => name)).toEqual(["start", "stop"]);
        expect(calls.session[1]?.[1]).toMatchObject({
            playbackStopInfo: { PositionTicks: 42, PlaySessionId: "session1" },
        });
    });

    it("swallows reporting failures", async () => {
        const { reporter } = await startedReporter();
        sessionFailure = new Error("offline");

        await expect(reporter.started({ positionTicks: 0, isPaused: false })).resolves.toBe(
            undefined,
        );
    });
});

describe("createPlaybackViewModel", () => {
    async function settled(viewModel: ReturnType<typeof createPlaybackViewModel>) {
        await vi.waitFor(() => {
            expect(viewModel.getBackgroundStates().size).toBe(0);
            expect(viewModel.getState()).not.toBe("loading");
        });
    }

    it("loads a source and re-negotiates for a track the stream can't switch to", async () => {
        const viewModel = createPlaybackViewModel(ctx, { itemID: "item1", capabilities });

        viewModel.send({ kind: "load", startTicks: 10 });
        await settled(viewModel);
        expect(viewModel.getState()).toBe("ready");
        expect(viewModel.getData().source?.playSessionID).toBe("session1");

        playbackInfoResponse = {
            PlaySessionId: "session2",
            MediaSources: [mediaSource({ SupportsDirectPlay: false, TranscodingUrl: transcodingURL })],
        };
        viewModel.send({
            kind: "selectTrack",
            change: { kind: "subtitle", index: 5 },
            positionTicks: 900,
        });
        await settled(viewModel);

        expect(calls.playbackInfo[1]).toMatchObject({
            playbackInfoDto: {
                MediaSourceId: "source1",
                StartTimeTicks: 900,
                AudioStreamIndex: 1,
                SubtitleStreamIndex: 5,
            },
        });
        expect(viewModel.getData().source?.playSessionID).toBe("session2");
    });

    it("switches in place without asking the server when it can", async () => {
        const viewModel = createPlaybackViewModel(ctx, { itemID: "item1", capabilities });

        viewModel.send({ kind: "load" });
        await settled(viewModel);
        viewModel.send({ kind: "selectTrack", change: { kind: "audio", index: 2 }, positionTicks: 5 });
        await settled(viewModel);

        expect(calls.playbackInfo).toHaveLength(1);
        expect(viewModel.getData().source?.audioStreamIndex).toBe(2);
    });
});
