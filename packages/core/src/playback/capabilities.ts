//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// What a video player engine can play. Each engine adapter in the app (AVPlayer, Media3, the
// browser, later mpv/VLC) describes itself with one of these; core turns it into the Jellyfin
// `DeviceProfile` the server uses to choose direct play, remux or transcode. This replaces
// Swiftfin's per-`VideoPlayerType` profile tables.
//

import type { VideoRangeType } from "@jellyfin/sdk/lib/generated-client/models/video-range-type";

/** A set of containers the engine plays directly, with the codecs it decodes inside them. */
export interface DirectPlayFormat {
    readonly containers: readonly string[];
    readonly videoCodecs: readonly string[];
    readonly audioCodecs: readonly string[];
}

/** What the server should transcode to (always HLS) when direct play isn't possible. */
export interface TranscodeFormat {
    /** Segment container: `mp4` (fMP4, required for HEVC over HLS) or `ts`. */
    readonly container: "mp4" | "ts";
    /** In order of preference — the server encodes to the first one it can. */
    readonly videoCodecs: readonly string[];
    readonly audioCodecs: readonly string[];
}

export interface PlayerCapabilities {
    /** Shown in diagnostics and sent as the profile name. */
    readonly name: string;
    readonly directPlay: readonly DirectPlayFormat[];
    readonly transcode: TranscodeFormat;
    /** Dynamic ranges the engine + display render correctly. SDR is always included. */
    readonly videoRanges: readonly VideoRangeType[];
    /** The largest video the decoder handles; larger sources are transcoded down. */
    readonly maxVideoSize?: { readonly width: number; readonly height: number };
    readonly maxAudioChannels: number;
    /**
     * Whether the engine can switch between audio tracks inside one file. Without it, choosing a
     * non-default audio track makes the server remux with only that track.
     */
    readonly selectsEmbeddedAudio: boolean;
    /**
     * Whether a separate subtitle file can be loaded alongside an HLS stream. AVPlayer can't — its
     * subtitles must come in the HLS manifest instead.
     */
    readonly sideloadsSubtitlesWithHls: boolean;
}

/** Bitmap subtitle formats: no engine here renders them, so the server burns them in. */
export const IMAGE_SUBTITLE_FORMATS: readonly string[] = [
    "pgssub",
    "pgs",
    "dvdsub",
    "dvbsub",
    "xsub",
];
