//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// The contract every video engine implements (react-native-video natively, <video> + hls.js on
// web; later mpv/VLC adapters). The player screen only talks to an engine through this, and each
// engine describes what it can decode with a `PlayerCapabilities` (see `capabilities.ts`).
//

import type { PlaybackSource } from "@anemone/core";

export interface EngineProps {
  source: PlaybackSource;
  paused: boolean;
  onLoad: (durationSeconds: number) => void;
  onProgress: (positionSeconds: number) => void;
  onBuffering: (isBuffering: boolean) => void;
  onEnd: () => void;
  onError: (message: string) => void;
}

export interface EngineHandle {
  seek: (positionSeconds: number) => void;
}

/**
 * The id an engine gives a sideloaded subtitle file, so it can select it by id. Stream titles
 * aren't unique and could collide with a track embedded in the file.
 */
export function subtitleTrackID(streamIndex: number): string {
  return `jellyfin-subtitle-${streamIndex}`;
}
