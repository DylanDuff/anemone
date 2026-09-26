//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// What this browser plays, probed with `canPlayType` / Media Source Extensions (as jellyfin-web
// does). Transcodes arrive as HLS, played by hls.js over MSE (or natively in Safari).
//

import type { PlayerCapabilities } from "@anemone/core";

/** Probe MIME strings for each Jellyfin codec name. */
const VIDEO_PROBES: Readonly<Record<string, string>> = {
  h264: 'video/mp4; codecs="avc1.640029"',
  hevc: 'video/mp4; codecs="hvc1.1.6.L120.90"',
  av1: 'video/mp4; codecs="av01.0.05M.08"',
  vp9: 'video/mp4; codecs="vp09.00.10.08"',
};

const AUDIO_PROBES: Readonly<Record<string, string>> = {
  aac: 'audio/mp4; codecs="mp4a.40.2"',
  mp3: 'audio/mp4; codecs="mp4a.69"',
  ac3: 'audio/mp4; codecs="ac-3"',
  eac3: 'audio/mp4; codecs="ec-3"',
  flac: 'audio/mp4; codecs="fLaC"',
  opus: 'audio/mp4; codecs="Opus"',
};

const WEBM_PROBES: Readonly<Record<string, string>> = {
  vp8: 'video/webm; codecs="vp8"',
  vp9: 'video/webm; codecs="vp9"',
  av1: 'video/webm; codecs="av01.0.05M.08"',
  opus: 'audio/webm; codecs="opus"',
  vorbis: 'audio/webm; codecs="vorbis"',
};

const WEBM_VIDEO = ["vp8", "vp9", "av1"];

function supported(
  probes: Readonly<Record<string, string>>,
  canPlay: (mimeType: string) => boolean,
): string[] {
  return Object.entries(probes)
    .filter(([, mimeType]) => canPlay(mimeType))
    .map(([codec]) => codec);
}

function browserCapabilities(): PlayerCapabilities {
  const video = document.createElement("video");
  const canPlay = (mimeType: string) => video.canPlayType(mimeType) !== "";
  // hls.js plays whatever Media Source Extensions accept.
  const canStream = (mimeType: string) =>
    globalThis.MediaSource?.isTypeSupported(mimeType) ?? canPlay(mimeType);

  const videoCodecs = supported(VIDEO_PROBES, canPlay);
  const audioCodecs = supported(AUDIO_PROBES, canPlay);
  const webm = supported(WEBM_PROBES, canPlay);

  return {
    name: "Anemone Web",
    directPlay: [
      { containers: ["mp4", "m4v", "mov"], videoCodecs, audioCodecs },
      {
        containers: ["webm"],
        videoCodecs: webm.filter((codec) => WEBM_VIDEO.includes(codec)),
        audioCodecs: webm.filter((codec) => !WEBM_VIDEO.includes(codec)),
      },
    ],
    transcode: {
      // MPEG-TS segments, as jellyfin-web uses with hls.js: hls.js remuxes them itself. The
      // server's fMP4 remux of MKV H.264 (video copied) produced an init segment Chrome's decoder
      // rejected (`kUnsupportedConfig` / `mediaSourceRequiresReset`).
      container: "ts",
      // H.264 only, as jellyfin-web does: browsers that claim HEVC via MSE (Chrome on macOS) can
      // still fail to decode the server's HEVC output ("kUnsupportedConfig"). H.264 sources in an
      // unplayable container (MKV) are then remuxed with the video copied rather than re-encoded.
      videoCodecs: ["h264"],
      audioCodecs: supported(AUDIO_PROBES, canStream).filter((codec) => codec !== "flac"),
    },
    videoRanges: [],
    maxAudioChannels: 6,
    // <video> can't switch between audio tracks in a file (outside Safari); the server remuxes.
    selectsEmbeddedAudio: false,
    sideloadsSubtitlesWithHls: true,
  };
}

let detected: Promise<PlayerCapabilities> | undefined;

export function detectCapabilities(): Promise<PlayerCapabilities> {
  detected ??= Promise.resolve(browserCapabilities());
  return detected;
}
