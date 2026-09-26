//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// Switching audio/subtitle tracks mid-playback. Some switches only change what the engine selects
// in the stream it already has; others change the stream itself (a remux with another audio
// track, subtitles burned in or moved into the HLS manifest), which means negotiating a new one.
//

import { PlayMethod } from "@jellyfin/sdk/lib/generated-client/models/play-method";
import type { PlayerCapabilities } from "./capabilities";
import {
    audioDelivery,
    isSideloaded,
    type PlaybackSource,
    type SubtitleDelivery,
    subtitleDelivery,
} from "./playbackSource";

export type TrackChange =
    | { readonly kind: "audio"; readonly index: number }
    | { readonly kind: "subtitle"; readonly index: number };

/** Deliveries that don't alter the video stream, so the engine can toggle them on its own. */
function isIndependentOfStream(delivery: SubtitleDelivery, method: PlayMethod): boolean {
    switch (delivery.kind) {
        case "none":
        case "external":
            return true;
        case "embedded":
            return method === PlayMethod.DirectPlay;
        case "manifest":
        case "burnedIn":
            return false;
    }
}

/**
 * Apply a track change without leaving the current stream, if possible. Returns the updated
 * source, or `undefined` when the stream itself must change — call `resolvePlayback` again with
 * the new track indices and the current position.
 */
export function selectTrackLocally(
    source: PlaybackSource,
    change: TrackChange,
    capabilities: PlayerCapabilities,
): PlaybackSource | undefined {
    if (change.kind === "audio") {
        const audio = audioDelivery(source.mediaSource, source.method, change.index, capabilities);
        if (audio.kind !== "embedded") {
            return undefined;
        }
        return { ...source, audioStreamIndex: change.index, audio };
    }

    const subtitle = subtitleDelivery(source.mediaSource, change.index);
    if (
        !isSideloaded(subtitle, source.externalSubtitles) ||
        !isIndependentOfStream(source.subtitle, source.method) ||
        !isIndependentOfStream(subtitle, source.method)
    ) {
        return undefined;
    }
    return { ...source, subtitleStreamIndex: change.index, subtitle };
}
