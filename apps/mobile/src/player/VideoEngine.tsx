//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// The native engine: react-native-video (AVPlayer on iOS/tvOS, Media3 on Android/Android TV).
// The web build resolves `VideoEngine.web.tsx` instead.
//

import { type PlaybackSource, ticksToSeconds } from "@anemone/core";
import { forwardRef, useImperativeHandle, useMemo, useRef } from "react";
import { StyleSheet } from "react-native";
import Video, {
  type ISO639_1,
  type ReactVideoSource,
  type SelectedTrack,
  SelectedTrackType,
  TextTrackType,
  type VideoRef,
} from "react-native-video";
import { type EngineHandle, type EngineProps, subtitleTrackID } from "./engine";

/**
 * The stream plus every sideloaded subtitle file. Rebuilt only for a new stream: changing it
 * reloads the video, so subtitle switches go through `selectedTextTrack` instead.
 */
function videoSource(source: PlaybackSource): ReactVideoSource {
  return {
    uri: source.url,
    type: source.isHls ? "m3u8" : undefined,
    startPosition: ticksToSeconds(source.startTicks) * 1000,
    textTracks: source.externalSubtitles.map((subtitle) => ({
      title: subtitleTrackID(subtitle.index),
      // Jellyfin uses ISO 639-2 codes; the engine only passes them through.
      language: (subtitle.language ?? "und") as ISO639_1,
      type: TextTrackType.VTT,
      uri: subtitle.url,
    })),
  };
}

function selectedTextTrack(source: PlaybackSource): SelectedTrack {
  const subtitle = source.subtitle;
  switch (subtitle.kind) {
    case "external":
      return { type: SelectedTrackType.TITLE, value: subtitleTrackID(subtitle.index) };
    case "embedded":
      return { type: SelectedTrackType.INDEX, value: subtitle.position };
    case "manifest":
      // The server puts only the selected subtitle in the HLS manifest.
      return { type: SelectedTrackType.INDEX, value: 0 };
    case "none":
    case "burnedIn":
      return { type: SelectedTrackType.DISABLED };
  }
}

function selectedAudioTrack(source: PlaybackSource): SelectedTrack | undefined {
  return source.audio.kind === "embedded"
    ? { type: SelectedTrackType.INDEX, value: source.audio.position }
    : undefined;
}

export const VideoEngine = forwardRef<EngineHandle, EngineProps>(function VideoEngine(
  { source, paused, onLoad, onProgress, onBuffering, onEnd, onError },
  ref,
) {
  const video = useRef<VideoRef>(null);
  useImperativeHandle(ref, () => ({ seek: (seconds) => video.current?.seek(seconds) }), []);

  // Keyed on the play session: a track switch within the stream keeps the same source object.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const streamSource = useMemo(() => videoSource(source), [source.playSessionID]);

  return (
    <Video
      ref={video}
      source={streamSource}
      paused={paused}
      selectedAudioTrack={selectedAudioTrack(source)}
      selectedTextTrack={selectedTextTrack(source)}
      style={StyleSheet.absoluteFill}
      resizeMode="contain"
      controls={false}
      // The screen's own controls take D-pad focus, not the video surface.
      focusable={false}
      preventsDisplaySleepDuringVideoPlayback
      ignoreSilentSwitch="ignore"
      shutterColor="#000000"
      progressUpdateInterval={500}
      onLoad={(event) => onLoad(event.duration)}
      onProgress={(event) => onProgress(event.currentTime)}
      onBuffer={(event) => onBuffering(event.isBuffering)}
      onEnd={onEnd}
      onError={({ error }) =>
        onError(error.localizedDescription ?? error.errorString ?? error.error ?? "Playback failed.")
      }
    />
  );
});
