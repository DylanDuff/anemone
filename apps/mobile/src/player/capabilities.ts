//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// What the native engine plays on this device: AVPlayer (iOS/tvOS, after Swiftfin's "native"
// profile) or Media3 (Android/Android TV, probed against the device's decoders). The web build
// resolves `capabilities.web.ts` instead.
//

import type { PlayerCapabilities } from "@anemone/core";
import { Platform } from "react-native";
import { VideoDecoderProperties } from "react-native-video";

const IOS_CAPABILITIES: PlayerCapabilities = {
  name: "Anemone AVPlayer",
  directPlay: [
    {
      containers: ["mp4", "m4v"],
      videoCodecs: ["h264", "hevc", "mpeg4"],
      audioCodecs: ["aac", "ac3", "eac3", "alac", "flac", "mp3"],
    },
    {
      containers: ["mov"],
      videoCodecs: ["h264", "hevc", "mjpeg", "mpeg4"],
      audioCodecs: ["aac", "ac3", "eac3", "alac", "mp3", "pcm_s16le", "pcm_s24le"],
    },
    {
      containers: ["mpegts", "ts"],
      videoCodecs: ["h264", "hevc"],
      audioCodecs: ["aac", "ac3", "eac3", "mp3"],
    },
  ],
  transcode: {
    container: "mp4",
    videoCodecs: ["hevc", "h264"],
    audioCodecs: ["aac", "ac3", "eac3", "alac", "flac"],
  },
  videoRanges: [
    "HDR10",
    "HDR10Plus",
    "HLG",
    "DOVI",
    "DOVIWithHDR10",
    "DOVIWithHLG",
    "DOVIWithHDR10Plus",
  ],
  maxAudioChannels: 8,
  selectsEmbeddedAudio: true,
  // AVPlayer can't combine sideloaded subtitles with HLS; they must come in the manifest.
  sideloadsSubtitlesWithHls: false,
};

const ANDROID_AUDIO = ["aac", "mp3", "flac", "opus", "vorbis"];

/** A decoder exists for this MIME type at this size (hardware or software). */
async function canDecode(mimeType: string, width: number, height: number): Promise<boolean> {
  try {
    return (await VideoDecoderProperties.isCodecSupported(mimeType, width, height)) !== "unsupported";
  } catch {
    return false;
  }
}

/**
 * Media3 plays through the device's MediaCodec decoders, which vary widely (a 1080p TV may have
 * no 4K or HEVC decoder), so the video side is probed. AC-3/E-AC-3/DTS aren't decodable on most
 * phones, so the server converts those audio tracks; AV1 is left to the server too, as it's
 * usually software-only and too slow on TV hardware.
 */
async function androidCapabilities(): Promise<PlayerCapabilities> {
  const [hevc, vp9, uhd] = await Promise.all([
    canDecode("video/hevc", 1920, 1080),
    canDecode("video/x-vnd.on2.vp9", 1920, 1080),
    canDecode("video/avc", 3840, 2160),
  ]);
  const videoCodecs = ["h264", ...(hevc ? ["hevc"] : []), ...(vp9 ? ["vp9"] : [])];

  return {
    name: "Anemone Media3",
    directPlay: [
      { containers: ["mp4", "m4v", "mkv", "mov"], videoCodecs, audioCodecs: ANDROID_AUDIO },
      { containers: ["webm"], videoCodecs: vp9 ? ["vp9", "vp8"] : ["vp8"], audioCodecs: ["opus", "vorbis"] },
      { containers: ["mpegts", "ts"], videoCodecs, audioCodecs: ["aac", "mp3"] },
    ],
    transcode: {
      container: "mp4",
      videoCodecs: hevc ? ["hevc", "h264"] : ["h264"],
      audioCodecs: ["aac", "mp3", "flac", "opus"],
    },
    videoRanges: [],
    maxVideoSize: uhd ? undefined : { width: 1920, height: 1080 },
    maxAudioChannels: 6,
    selectsEmbeddedAudio: true,
    sideloadsSubtitlesWithHls: true,
  };
}

let detected: Promise<PlayerCapabilities> | undefined;

/** This device's engine capabilities, probed once per launch. */
export function detectCapabilities(): Promise<PlayerCapabilities> {
  detected ??=
    Platform.OS === "android" ? androidCapabilities() : Promise.resolve(IOS_CAPABILITIES);
  return detected;
}
