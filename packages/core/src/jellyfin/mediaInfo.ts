//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// Display labels derived from an item's media sources/streams — the badges in the item header
// (Swiftfin `AttributeHStack`) and the per-version breakdown in "About" (`MediaSourcesCard`).
//

import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import type { MediaSourceInfo } from "@jellyfin/sdk/lib/generated-client/models/media-source-info";
import type { MediaStream } from "@jellyfin/sdk/lib/generated-client/models/media-stream";
import { MediaStreamType } from "@jellyfin/sdk/lib/generated-client/models/media-stream-type";
import { VideoRangeType } from "@jellyfin/sdk/lib/generated-client/models/video-range-type";

/** Width-based thresholds, so letterboxed films (e.g. 3840×1600) still read as 4K. */
const RESOLUTION_THRESHOLDS: ReadonlyArray<[minimumWidth: number, label: string]> = [
    [7600, "8K"],
    [3800, "4K"],
    [2500, "1440p"],
    [1900, "1080p"],
    [1260, "720p"],
    [700, "480p"],
];

const CODEC_LABELS: Readonly<Record<string, string>> = {
    h264: "H.264",
    hevc: "HEVC",
    h265: "HEVC",
    av1: "AV1",
    vp9: "VP9",
    mpeg2video: "MPEG-2",
    truehd: "TrueHD",
    eac3: "DD+",
    ac3: "DD",
    dts: "DTS",
    aac: "AAC",
    flac: "FLAC",
    opus: "Opus",
    mp3: "MP3",
};

/** "4K", "1080p", … for a video stream; `undefined` without dimensions. */
export function videoResolutionLabel(stream: MediaStream): string | undefined {
    const width = stream.Width ?? 0;
    if (width <= 0) {
        return undefined;
    }
    const match = RESOLUTION_THRESHOLDS.find(([minimumWidth]) => width >= minimumWidth);
    return match ? match[1] : "SD";
}

/** "Dolby Vision", "HDR10", … for a video stream; `undefined` for SDR/unknown. */
export function videoRangeLabel(stream: MediaStream): string | undefined {
    const range = stream.VideoRangeType;
    if (!range || range === VideoRangeType.Sdr || range === VideoRangeType.Unknown) {
        return undefined;
    }
    if (range.startsWith("DOVI")) {
        return "Dolby Vision";
    }
    if (range === VideoRangeType.Hdr10Plus) {
        return "HDR10+";
    }
    return range;
}

/** "Stereo", "5.1", … from a channel count. */
export function audioChannelsLabel(channels: number | null | undefined): string | undefined {
    switch (channels) {
        case null:
        case undefined:
            return undefined;
        case 1:
            return "Mono";
        case 2:
            return "Stereo";
        case 6:
            return "5.1";
        case 8:
            return "7.1";
        default:
            return `${channels}ch`;
    }
}

/** A short, human codec name ("HEVC", "TrueHD", …), falling back to the upper-cased raw codec. */
export function codecLabel(codec: string | null | undefined): string | undefined {
    if (!codec) {
        return undefined;
    }
    return CODEC_LABELS[codec.toLowerCase()] ?? codec.toUpperCase();
}

function streamsOfType(streams: readonly MediaStream[], type: MediaStreamType): MediaStream[] {
    return streams.filter((stream) => stream.Type === type);
}

/** The default stream of a type, else the first — mirrors how players pick an initial track. */
function defaultStream(
    streams: readonly MediaStream[],
    type: MediaStreamType,
): MediaStream | undefined {
    const ofType = streamsOfType(streams, type);
    return ofType.find((stream) => stream.IsDefault) ?? ofType[0];
}

function joinParts(parts: ReadonlyArray<string | undefined>, separator = " "): string | undefined {
    const present = parts.filter((part): part is string => Boolean(part));
    return present.length > 0 ? present.join(separator) : undefined;
}

/** A per-track label: the server's `DisplayTitle` if present, else language + codec + channels. */
function trackLabel(stream: MediaStream): string {
    return (
        stream.DisplayTitle ??
        joinParts([
            stream.Language ?? undefined,
            codecLabel(stream.Codec),
            audioChannelsLabel(stream.Channels),
        ]) ??
        "Unknown"
    );
}

/** A structured breakdown of one media source (one "version" of an item). */
export interface MediaSourceSummary {
    readonly name: string | undefined;
    readonly container: string | undefined;
    /** e.g. "4K HEVC Dolby Vision". */
    readonly video: string | undefined;
    readonly audio: readonly string[];
    readonly subtitles: readonly string[];
}

export function mediaSourceSummary(source: MediaSourceInfo): MediaSourceSummary {
    const streams = source.MediaStreams ?? [];
    const video = defaultStream(streams, MediaStreamType.Video);

    return {
        name: source.Name ?? undefined,
        container: source.Container?.toUpperCase(),
        video: video
            ? joinParts([
                  videoResolutionLabel(video),
                  codecLabel(video.Codec),
                  videoRangeLabel(video),
              ])
            : undefined,
        audio: streamsOfType(streams, MediaStreamType.Audio).map(trackLabel),
        subtitles: streamsOfType(streams, MediaStreamType.Subtitle).map(trackLabel),
    };
}

/**
 * Compact header badges for an item's primary version — resolution, dynamic range, and the default
 * audio track's channel layout (e.g. `["4K", "Dolby Vision", "7.1"]`). Swiftfin `AttributeHStack`.
 */
export function mediaAttributeBadges(item: BaseItemDto): string[] {
    const streams = item.MediaSources?.[0]?.MediaStreams ?? item.MediaStreams ?? [];
    const video = defaultStream(streams, MediaStreamType.Video);
    const audio = defaultStream(streams, MediaStreamType.Audio);

    return [
        video ? videoResolutionLabel(video) : undefined,
        video ? videoRangeLabel(video) : undefined,
        audio ? audioChannelsLabel(audio.Channels) : undefined,
        streamsOfType(streams, MediaStreamType.Subtitle).length > 0 ? "CC" : undefined,
    ].filter((badge): badge is string => Boolean(badge));
}
