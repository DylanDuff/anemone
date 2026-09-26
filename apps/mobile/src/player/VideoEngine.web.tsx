//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// The web engine: a plain <video>, with hls.js for HLS (the browser's own HLS only where hls.js
// can't run). react-native-video's web player has neither HLS nor track support.
//

import { type PlaybackSource, ticksToSeconds, useContainer } from "@anemone/core";
import Hls from "hls.js";
import { type CSSProperties, forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { type EngineHandle, type EngineProps, subtitleTrackID } from "./engine";

/** Show the selected sideloaded subtitle, hide the rest. */
function applySubtitle(video: HTMLVideoElement, source: PlaybackSource): void {
  const selectedID =
    source.subtitle.kind === "external" ? subtitleTrackID(source.subtitle.index) : undefined;
  for (const track of Array.from(video.textTracks)) {
    track.mode = track.id === selectedID ? "showing" : "disabled";
  }
}

export const VideoEngine = forwardRef<EngineHandle, EngineProps>(function VideoEngine(
  { source, paused, onLoad, onProgress, onBuffering, onEnd, onError },
  ref,
) {
  const element = useRef<HTMLVideoElement>(null);
  const { logger } = useContainer();
  // Latest callbacks, so the load effect doesn't re-run when the parent re-renders.
  const callbacks = useRef({ onLoad, onError });
  callbacks.current = { onLoad, onError };

  useImperativeHandle(
    ref,
    () => ({
      seek: (seconds) => {
        if (element.current) {
          element.current.currentTime = seconds;
        }
      },
    }),
    [],
  );

  // Load the stream: once per play session, like the native engine.
  useEffect(() => {
    const video = element.current;
    if (!video) {
      return;
    }
    const startSeconds = ticksToSeconds(source.startTicks);
    let hls: Hls | undefined;

    // hls.js wherever it runs, as jellyfin-web does, rather than a browser's own HLS player (recent
    // Chrome claims one via `canPlayType`). The URL isn't logged: it carries the access token.
    const mode = !source.isHls ? "progressive" : Hls.isSupported() ? "hls.js" : "native HLS";
    logger.log("info", "Web playback", { mode, method: source.method });

    if (mode === "hls.js") {
      hls = new Hls({ startPosition: startSeconds });
      hls.on(Hls.Events.MANIFEST_PARSED, (_event, data) => {
        logger.log("info", "HLS manifest", {
          codecs: data.levels.map((level) => [level.videoCodec, level.audioCodec]),
        });
      });
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          callbacks.current.onError(`Playback failed (${data.details}).`);
        }
      });
      hls.loadSource(source.url);
      hls.attachMedia(video);
    } else {
      video.src = source.url;
      video.addEventListener(
        "loadedmetadata",
        () => {
          if (startSeconds > 0) {
            video.currentTime = startSeconds;
          }
        },
        { once: true },
      );
    }

    return () => {
      hls?.destroy();
      video.removeAttribute("src");
      video.load();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [source.playSessionID]);

  useEffect(() => {
    const video = element.current;
    if (!video) {
      return;
    }
    if (paused) {
      video.pause();
    } else {
      // Rejected when the browser blocks autoplay; the controls stay usable to start it.
      video.play().catch(() => undefined);
    }
  }, [paused, source.playSessionID]);

  // Subtitle tracks appear asynchronously after <track> elements mount; apply on each addition.
  useEffect(() => {
    const video = element.current;
    if (!video) {
      return;
    }
    applySubtitle(video, source);
    const reapply = () => applySubtitle(video, source);
    video.textTracks.addEventListener("addtrack", reapply);
    return () => video.textTracks.removeEventListener("addtrack", reapply);
  }, [source]);

  return (
    <video
      ref={element}
      // Subtitle files come from the server's origin; cross-origin <track>s need CORS mode.
      crossOrigin="anonymous"
      playsInline
      style={styles.video}
      onLoadedMetadata={(event) => callbacks.current.onLoad(event.currentTarget.duration)}
      onTimeUpdate={(event) => onProgress(event.currentTarget.currentTime)}
      onWaiting={() => onBuffering(true)}
      onPlaying={() => onBuffering(false)}
      onCanPlay={() => onBuffering(false)}
      onEnded={onEnd}
      onError={(event) =>
        onError(event.currentTarget.error?.message || "This video can't be played in this browser.")
      }
    >
      {source.externalSubtitles.map((subtitle) => (
        <track
          key={subtitle.index}
          id={subtitleTrackID(subtitle.index)}
          kind="subtitles"
          src={subtitle.url}
          label={subtitle.title}
          srcLang={subtitle.language}
        />
      ))}
    </video>
  );
});

const styles = {
  video: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "contain",
    backgroundColor: "#000000",
  },
} satisfies Record<string, CSSProperties>;
