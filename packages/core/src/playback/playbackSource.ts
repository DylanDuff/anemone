//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// Negotiates a playable stream with the server (Swiftfin `MediaPlayerItem.build`): posts the
// engine's device profile to `/Items/{id}/PlaybackInfo`, then turns the chosen media source into
// what an engine needs — a URL, and how the selected audio and subtitle tracks arrive.
//

import type { MediaSourceInfo } from "@jellyfin/sdk/lib/generated-client/models/media-source-info";
import type { MediaStream } from "@jellyfin/sdk/lib/generated-client/models/media-stream";
import { MediaStreamType } from "@jellyfin/sdk/lib/generated-client/models/media-stream-type";
import { PlayMethod } from "@jellyfin/sdk/lib/generated-client/models/play-method";
import { PlaybackErrorCode } from "@jellyfin/sdk/lib/generated-client/models/playback-error-code";
import { SubtitleDeliveryMethod } from "@jellyfin/sdk/lib/generated-client/models/subtitle-delivery-method";
import { ErrorMessage } from "../errors/errorMessage";
import { getMediaInfoApi } from "../jellyfin/api";
import type { Api } from "../jellyfin/client";
import { streamsOfType, trackLabel } from "../jellyfin/mediaInfo";
import type { QueryContext } from "../query/queryContext";
import type { PlayerCapabilities } from "./capabilities";
import { buildDeviceProfile } from "./deviceProfile";

/** The subtitle stream index meaning "no subtitles" (Jellyfin's convention). */
export const SUBTITLES_OFF = -1;

export interface PlaybackRequest {
    readonly itemID: string;
    /** Which version to play; the server's first when omitted. */
    readonly mediaSourceID?: string;
    readonly startTicks?: number;
    /** Omit for the server's default (the user's language preferences). */
    readonly audioStreamIndex?: number;
    /** A subtitle stream index or `SUBTITLES_OFF`. Omit for the server's default. */
    readonly subtitleStreamIndex?: number;
    readonly capabilities: PlayerCapabilities;
    /** Bits per second; omit to let the server decide. */
    readonly maxBitrate?: number;
}

/** A selectable audio or subtitle track, by its Jellyfin stream index. */
export interface PlaybackTrack {
    readonly index: number;
    readonly title: string;
    readonly language: string | undefined;
}

/**
 * How the selected audio reaches the engine: the only/default track of the stream, or one of
 * several in the file, picked by its position among the file's audio tracks.
 */
export type AudioDelivery =
    | { readonly kind: "default" }
    | { readonly kind: "embedded"; readonly position: number };

/** A WebVTT subtitle file the engine loads beside the video. */
export interface ExternalSubtitle {
    /** The Jellyfin stream index — also what the engine selects it by. */
    readonly index: number;
    readonly url: string;
    readonly title: string;
    readonly language: string | undefined;
}

/**
 * How the selected subtitle reaches the engine: one of the source's `externalSubtitles`, a track
 * inside the file or HLS manifest, or drawn into the video by the server.
 */
export type SubtitleDelivery =
    | { readonly kind: "none" }
    | { readonly kind: "external"; readonly index: number }
    | { readonly kind: "embedded"; readonly position: number }
    | { readonly kind: "manifest" }
    | { readonly kind: "burnedIn" };

export interface PlaybackSource {
    readonly itemID: string;
    readonly mediaSourceID: string;
    readonly playSessionID: string;
    readonly url: string;
    readonly method: PlayMethod;
    /** An HLS playlist (always the case when transcoding or remuxing). */
    readonly isHls: boolean;
    readonly startTicks: number;
    readonly runtimeTicks: number | undefined;
    readonly audioTracks: readonly PlaybackTrack[];
    readonly subtitleTracks: readonly PlaybackTrack[];
    /**
     * Every subtitle delivered as a separate file. Engines load them all with the stream, so
     * switching between them (or off) is only a selection and never reloads the video.
     */
    readonly externalSubtitles: readonly ExternalSubtitle[];
    readonly audioStreamIndex: number | undefined;
    /** The selected subtitle stream, or `SUBTITLES_OFF`. */
    readonly subtitleStreamIndex: number;
    readonly audio: AudioDelivery;
    readonly subtitle: SubtitleDelivery;
    /** The negotiated media source, kept to re-derive deliveries when switching tracks locally. */
    readonly mediaSource: MediaSourceInfo;
}

const PLAYBACK_ERROR_MESSAGES: Readonly<Record<string, string>> = {
    [PlaybackErrorCode.NotAllowed]: "You aren't allowed to play this item.",
    [PlaybackErrorCode.NoCompatibleStream]: "The server couldn't find a playable stream.",
    [PlaybackErrorCode.RateLimitExceeded]: "Too many streams are playing on this server.",
};

/** Make a server path absolute, leaving full URLs (e.g. remote subtitle files) untouched. */
function absoluteURL(api: Api, pathOrURL: string): string {
    if (/^https?:\/\//i.test(pathOrURL)) {
        return pathOrURL;
    }
    const base = api.basePath.replace(/\/+$/, "");
    return `${base}${pathOrURL.startsWith("/") ? "" : "/"}${pathOrURL}`;
}

/**
 * Add the access token as a query parameter unless one is already present. Media URLs need it in
 * the query: a browser `<video>` / `<track>` can't send an authorization header.
 */
function withAccessToken(url: string, accessToken: string): string {
    if (!accessToken || /[?&](api_key|apikey)=/i.test(url)) {
        return url;
    }
    const separator = url.includes("?") ? "&" : "?";
    return `${url}${separator}ApiKey=${encodeURIComponent(accessToken)}`;
}

/** An authenticated, absolute media URL for a server path. */
export function mediaURL(api: Api, pathOrURL: string): string {
    return withAccessToken(absoluteURL(api, pathOrURL), api.accessToken);
}

function directPlayURL(
    api: Api,
    itemID: string,
    source: MediaSourceInfo,
    playSessionID: string,
): string {
    const params = new URLSearchParams({ static: "true", playSessionId: playSessionID });
    if (source.Id) {
        params.set("mediaSourceId", source.Id);
    }
    if (source.ETag) {
        params.set("tag", source.ETag);
    }
    return mediaURL(api, `/Videos/${encodeURIComponent(itemID)}/stream?${params.toString()}`);
}

function selectableStreams(source: MediaSourceInfo, type: MediaStreamType): MediaStream[] {
    return streamsOfType(source.MediaStreams ?? [], type).filter(
        (stream) => stream.Index !== undefined,
    );
}

function playbackTracks(source: MediaSourceInfo, type: MediaStreamType): PlaybackTrack[] {
    return selectableStreams(source, type).map((stream) => ({
        index: stream.Index as number,
        title: trackLabel(stream),
        language: stream.Language ?? undefined,
    }));
}

/**
 * The position of a stream among the tracks of its type inside the file — how engines address
 * embedded tracks. External streams aren't in the file, so they have no position.
 */
function embeddedPosition(source: MediaSourceInfo, stream: MediaStream): number | undefined {
    if (stream.IsExternal || stream.Type === undefined) {
        return undefined;
    }
    const embedded = selectableStreams(source, stream.Type).filter(
        (candidate) => !candidate.IsExternal,
    );
    const position = embedded.findIndex((candidate) => candidate.Index === stream.Index);
    return position >= 0 ? position : undefined;
}

function findStream(
    source: MediaSourceInfo,
    type: MediaStreamType,
    index: number | undefined,
): MediaStream | undefined {
    return index === undefined
        ? undefined
        : selectableStreams(source, type).find((stream) => stream.Index === index);
}

export function audioDelivery(
    source: MediaSourceInfo,
    method: PlayMethod,
    audioStreamIndex: number | undefined,
    capabilities: PlayerCapabilities,
): AudioDelivery {
    const stream = findStream(source, MediaStreamType.Audio, audioStreamIndex);
    // A remux/transcode contains only the selected track.
    if (!stream || method !== PlayMethod.DirectPlay || !capabilities.selectsEmbeddedAudio) {
        return { kind: "default" };
    }
    const position = embeddedPosition(source, stream);
    return position === undefined ? { kind: "default" } : { kind: "embedded", position };
}

/** The subtitle streams the server delivers as separate WebVTT files. */
function externalSubtitles(api: Api, source: MediaSourceInfo): ExternalSubtitle[] {
    return selectableStreams(source, MediaStreamType.Subtitle).flatMap((stream) =>
        stream.DeliveryMethod === SubtitleDeliveryMethod.External && stream.DeliveryUrl
            ? [
                  {
                      index: stream.Index as number,
                      url: stream.IsExternalUrl
                          ? stream.DeliveryUrl
                          : mediaURL(api, stream.DeliveryUrl),
                      title: trackLabel(stream),
                      language: stream.Language ?? undefined,
                  },
              ]
            : [],
    );
}

/** How a subtitle stream is delivered, from the method the server assigned it. */
export function subtitleDelivery(
    source: MediaSourceInfo,
    subtitleStreamIndex: number,
): SubtitleDelivery {
    const stream = findStream(source, MediaStreamType.Subtitle, subtitleStreamIndex);
    if (!stream) {
        return { kind: "none" };
    }

    switch (stream.DeliveryMethod) {
        case SubtitleDeliveryMethod.External:
            return stream.DeliveryUrl
                ? { kind: "external", index: subtitleStreamIndex }
                : { kind: "none" };
        case SubtitleDeliveryMethod.Hls:
            return { kind: "manifest" };
        case SubtitleDeliveryMethod.Embed: {
            const position = embeddedPosition(source, stream);
            return position === undefined ? { kind: "none" } : { kind: "embedded", position };
        }
        case SubtitleDeliveryMethod.Encode:
            return { kind: "burnedIn" };
        default:
            return { kind: "none" };
    }
}

/** An external subtitle is only usable if the engine loaded its file; other kinds always are. */
export function isSideloaded(
    delivery: SubtitleDelivery,
    sideloaded: readonly ExternalSubtitle[],
): boolean {
    return (
        delivery.kind !== "external" ||
        sideloaded.some((subtitle) => subtitle.index === delivery.index)
    );
}

function pickMediaSource(
    sources: readonly MediaSourceInfo[],
    mediaSourceID: string | undefined,
): MediaSourceInfo | undefined {
    return sources.find((source) => source.Id === mediaSourceID) ?? sources[0];
}

/**
 * Ask the server how to play an item with this engine, and resolve the answer into a
 * `PlaybackSource`. Throws an `ErrorMessage` when the server refuses or has no playable stream.
 */
export async function resolvePlayback(
    ctx: QueryContext,
    request: PlaybackRequest,
): Promise<PlaybackSource> {
    const response = await getMediaInfoApi(ctx.api).getPostedPlaybackInfo({
        itemId: request.itemID,
        playbackInfoDto: {
            UserId: ctx.userID,
            DeviceProfile: buildDeviceProfile(request.capabilities, request.maxBitrate),
            MaxStreamingBitrate: request.maxBitrate ?? null,
            StartTimeTicks: request.startTicks ?? null,
            AudioStreamIndex: request.audioStreamIndex ?? null,
            SubtitleStreamIndex: request.subtitleStreamIndex ?? null,
            MediaSourceId: request.mediaSourceID ?? null,
            AutoOpenLiveStream: true,
            EnableDirectPlay: true,
            EnableDirectStream: true,
            EnableTranscoding: true,
            AllowVideoStreamCopy: true,
            AllowAudioStreamCopy: true,
        },
    });

    const info = response.data;
    if (info.ErrorCode) {
        throw new ErrorMessage(
            PLAYBACK_ERROR_MESSAGES[info.ErrorCode] ?? "This item can't be played.",
        );
    }

    const source = pickMediaSource(info.MediaSources ?? [], request.mediaSourceID);
    const playSessionID = info.PlaySessionId;
    if (!source?.Id || !playSessionID) {
        throw new ErrorMessage("The server didn't return a playable stream.");
    }

    let url: string;
    let method: PlayMethod;
    if (source.TranscodingUrl) {
        url = mediaURL(ctx.api, source.TranscodingUrl);
        method = PlayMethod.Transcode;
    } else if (source.SupportsDirectPlay) {
        url = directPlayURL(ctx.api, request.itemID, source, playSessionID);
        method = PlayMethod.DirectPlay;
    } else {
        throw new ErrorMessage(PLAYBACK_ERROR_MESSAGES[PlaybackErrorCode.NoCompatibleStream]!);
    }

    const audioStreamIndex =
        request.audioStreamIndex ??
        source.DefaultAudioStreamIndex ??
        selectableStreams(source, MediaStreamType.Audio)[0]?.Index;
    const subtitleStreamIndex =
        request.subtitleStreamIndex ?? source.DefaultSubtitleStreamIndex ?? SUBTITLES_OFF;
    const isHls = method === PlayMethod.Transcode;
    const sideloaded =
        isHls && !request.capabilities.sideloadsSubtitlesWithHls
            ? []
            : externalSubtitles(ctx.api, source);
    const subtitle = subtitleDelivery(source, subtitleStreamIndex);

    return {
        itemID: request.itemID,
        mediaSourceID: source.Id,
        playSessionID,
        url,
        method,
        isHls,
        startTicks: request.startTicks ?? 0,
        runtimeTicks: source.RunTimeTicks ?? undefined,
        audioTracks: playbackTracks(source, MediaStreamType.Audio),
        subtitleTracks: playbackTracks(source, MediaStreamType.Subtitle),
        externalSubtitles: sideloaded,
        audioStreamIndex: audioStreamIndex ?? undefined,
        subtitleStreamIndex,
        audio: audioDelivery(source, method, audioStreamIndex ?? undefined, request.capabilities),
        subtitle: isSideloaded(subtitle, sideloaded) ? subtitle : { kind: "none" },
        mediaSource: source,
    };
}
