//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// Builds the Jellyfin `DeviceProfile` for a player engine (Swiftfin `DeviceProfile.build`). The
// server compares each media source against it to pick direct play, remux or transcode, and the
// delivery method for every subtitle stream.
//

import type { CodecProfile } from "@jellyfin/sdk/lib/generated-client/models/codec-profile";
import { CodecType } from "@jellyfin/sdk/lib/generated-client/models/codec-type";
import type { DeviceProfile } from "@jellyfin/sdk/lib/generated-client/models/device-profile";
import { DlnaProfileType } from "@jellyfin/sdk/lib/generated-client/models/dlna-profile-type";
import { EncodingContext } from "@jellyfin/sdk/lib/generated-client/models/encoding-context";
import { MediaStreamProtocol } from "@jellyfin/sdk/lib/generated-client/models/media-stream-protocol";
import type { ProfileCondition } from "@jellyfin/sdk/lib/generated-client/models/profile-condition";
import { ProfileConditionType } from "@jellyfin/sdk/lib/generated-client/models/profile-condition-type";
import { ProfileConditionValue } from "@jellyfin/sdk/lib/generated-client/models/profile-condition-value";
import { SubtitleDeliveryMethod } from "@jellyfin/sdk/lib/generated-client/models/subtitle-delivery-method";
import type { SubtitleProfile } from "@jellyfin/sdk/lib/generated-client/models/subtitle-profile";
import { VideoRangeType } from "@jellyfin/sdk/lib/generated-client/models/video-range-type";
import { IMAGE_SUBTITLE_FORMATS, type PlayerCapabilities } from "./capabilities";

/** Ranges every engine renders: SDR, and Dolby Vision's SDR-compatible base layer. */
const SDR_RANGES: readonly VideoRangeType[] = [VideoRangeType.Sdr, VideoRangeType.DoviWithSdr];

function condition(
    type: ProfileConditionType,
    property: ProfileConditionValue,
    value: string | number | readonly string[],
): ProfileCondition {
    return {
        Condition: type,
        Property: property,
        Value: Array.isArray(value) ? value.join("|") : String(value),
        // Not required: a stream missing the property (unknown level, range, …) still passes.
        IsRequired: false,
    };
}

const notAnamorphic = condition(
    ProfileConditionType.NotEquals,
    ProfileConditionValue.IsAnamorphic,
    "true",
);
const notInterlaced = condition(
    ProfileConditionType.NotEquals,
    ProfileConditionValue.IsInterlaced,
    "true",
);

function rangeCondition(ranges: readonly VideoRangeType[]): ProfileCondition {
    return condition(ProfileConditionType.EqualsAny, ProfileConditionValue.VideoRangeType, ranges);
}

function videoCodecProfile(codec: string, conditions: ProfileCondition[]): CodecProfile {
    return { Type: CodecType.Video, Codec: codec, Conditions: conditions };
}

function codecProfiles(capabilities: PlayerCapabilities): CodecProfile[] {
    const ranges = [...new Set([...SDR_RANGES, ...capabilities.videoRanges])];

    const profiles: CodecProfile[] = [
        videoCodecProfile("h264", [
            notAnamorphic,
            notInterlaced,
            condition(ProfileConditionType.EqualsAny, ProfileConditionValue.VideoProfile, [
                "high",
                "main",
                "baseline",
                "constrained baseline",
            ]),
            condition(ProfileConditionType.LessThanEqual, ProfileConditionValue.VideoLevel, 52),
            // H.264 carries no HDR metadata the players act on.
            rangeCondition(SDR_RANGES),
        ]),
        videoCodecProfile("hevc", [
            notAnamorphic,
            notInterlaced,
            condition(ProfileConditionType.EqualsAny, ProfileConditionValue.VideoProfile, [
                "main",
                "main 10",
            ]),
            condition(ProfileConditionType.LessThanEqual, ProfileConditionValue.VideoLevel, 183),
            rangeCondition(ranges),
        ]),
        videoCodecProfile("av1", [notAnamorphic, notInterlaced, rangeCondition(ranges)]),
        videoCodecProfile("vp9", [notAnamorphic, notInterlaced, rangeCondition(ranges)]),
        {
            Type: CodecType.VideoAudio,
            Conditions: [
                condition(
                    ProfileConditionType.LessThanEqual,
                    ProfileConditionValue.AudioChannels,
                    capabilities.maxAudioChannels,
                ),
                // Only the default audio track can play directly; others need a remux.
                ...(capabilities.selectsEmbeddedAudio
                    ? []
                    : [
                          condition(
                              ProfileConditionType.Equals,
                              ProfileConditionValue.IsSecondaryAudio,
                              "false",
                          ),
                      ]),
            ],
        },
    ];

    const size = capabilities.maxVideoSize;
    if (size) {
        // A profile without a codec applies to every video codec.
        profiles.push({
            Type: CodecType.Video,
            Conditions: [
                condition(ProfileConditionType.LessThanEqual, ProfileConditionValue.Width, size.width),
                condition(
                    ProfileConditionType.LessThanEqual,
                    ProfileConditionValue.Height,
                    size.height,
                ),
            ],
        });
    }

    return profiles;
}

/**
 * Text subtitles are delivered as WebVTT (the server converts SRT/ASS/…), which every engine here
 * renders; bitmap subtitles are burned in. The server takes the first profile that fits, so an
 * engine that can't sideload beside HLS lists manifest delivery first — it only applies while
 * transcoding, and direct play falls through to the external file.
 */
function subtitleProfiles(capabilities: PlayerCapabilities): SubtitleProfile[] {
    return [
        ...(capabilities.sideloadsSubtitlesWithHls
            ? []
            : [{ Format: "vtt", Method: SubtitleDeliveryMethod.Hls }]),
        { Format: "vtt", Method: SubtitleDeliveryMethod.External },
        ...IMAGE_SUBTITLE_FORMATS.map((format) => ({
            Format: format,
            Method: SubtitleDeliveryMethod.Encode,
        })),
    ];
}

/**
 * The device profile for an engine. `maxBitrate` (bits/second) caps both direct play and
 * transcodes; omit it to let the server decide.
 */
export function buildDeviceProfile(
    capabilities: PlayerCapabilities,
    maxBitrate?: number,
): DeviceProfile {
    const transcode = capabilities.transcode;

    return {
        Name: capabilities.name,
        MaxStreamingBitrate: maxBitrate ?? null,
        MaxStaticBitrate: maxBitrate ?? null,
        DirectPlayProfiles: capabilities.directPlay.map((format) => ({
            Type: DlnaProfileType.Video,
            Container: format.containers.join(","),
            VideoCodec: format.videoCodecs.join(","),
            AudioCodec: format.audioCodecs.join(","),
        })),
        TranscodingProfiles: [
            {
                Type: DlnaProfileType.Video,
                Protocol: MediaStreamProtocol.Hls,
                Context: EncodingContext.Streaming,
                Container: transcode.container,
                VideoCodec: transcode.videoCodecs.join(","),
                AudioCodec: transcode.audioCodecs.join(","),
                MaxAudioChannels: String(capabilities.maxAudioChannels),
                MinSegments: 2,
                BreakOnNonKeyFrames: true,
                EnableSubtitlesInManifest: !capabilities.sideloadsSubtitlesWithHls,
            },
        ],
        ContainerProfiles: [],
        CodecProfiles: codecProfiles(capabilities),
        SubtitleProfiles: subtitleProfiles(capabilities),
    };
}
