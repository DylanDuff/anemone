//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// A playing item: negotiates the stream (core `PlaybackViewModel`), renders it with this platform's
// engine, reports progress to the server, and draws the controls.
//

import {
  createPlaybackViewModel,
  type PlayerCapabilities,
  secondsToTicks,
  ticksToSeconds,
  type TrackChange,
  usePlaybackReporting,
  useQueryContext,
  useStateful,
} from "@anemone/core";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { useAppNavigation } from "../navigation/routes";
import { Focusable } from "../ui/Focusable";
import { space, theme } from "../ui/theme";
import { type RemoteEvent, useRemoteEvents } from "../ui/tv";
import type { EngineHandle } from "./engine";
import { PlayerControls, SKIP_BACK_SECONDS, SKIP_FORWARD_SECONDS } from "./PlayerControls";
import { TrackMenu } from "./TrackMenu";
import { useAutoHide } from "./useAutoHide";
import { VideoEngine } from "./VideoEngine";

/** How far a D-pad left/right scrubs, in seconds. */
const SCRUB_SECONDS = 10;

/** Remote keys that count as interaction (focus/blur events also arrive through the same hook). */
const REMOTE_KEYS = new Set([
  "up",
  "down",
  "left",
  "right",
  "select",
  "longSelect",
  "playPause",
  "fastForward",
  "rewind",
]);

export function Player({
  itemID,
  mediaSourceID,
  startTicks,
  capabilities,
  title,
  subtitle,
}: {
  itemID: string;
  mediaSourceID: string | undefined;
  startTicks: number | undefined;
  capabilities: PlayerCapabilities;
  title: string | undefined;
  subtitle: string | undefined;
}) {
  const ctx = useQueryContext();
  const navigation = useAppNavigation();
  const [viewModel] = useState(() => createPlaybackViewModel(ctx, { itemID, capabilities }));
  const { data, error } = useStateful(viewModel);
  const source = data.source;
  const reporting = usePlaybackReporting(source);
  const engine = useRef<EngineHandle>(null);

  const [paused, setPaused] = useState(false);
  const [position, setPosition] = useState(ticksToSeconds(startTicks ?? 0));
  const [duration, setDuration] = useState(0);
  const [buffering, setBuffering] = useState(true);
  const [engineError, setEngineError] = useState<string | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const seekBarFocused = useRef(false);

  const errorMessage = error?.message ?? engineError;
  const controls = useAutoHide(paused || menuOpen || errorMessage !== null);

  useEffect(() => {
    viewModel.send({ kind: "load", startTicks, mediaSourceID });
    return () => viewModel.dispose();
    // Loads once for this screen; the params don't change while it's mounted.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewModel]);

  // A new stream (first load or a re-negotiated track switch) buffers until the engine loads it.
  useEffect(() => {
    if (source) {
      setBuffering(true);
      setEngineError(null);
      if (source.runtimeTicks) {
        setDuration(ticksToSeconds(source.runtimeTicks));
      }
    }
  }, [source?.playSessionID]);

  const pausedRef = useRef(paused);
  pausedRef.current = paused;
  const togglePause = useCallback(() => {
    const next = !pausedRef.current;
    setPaused(next);
    reporting.pausedChanged(next);
    controls.show();
  }, [reporting, controls]);

  const seekTo = useCallback(
    (seconds: number) => {
      if (!Number.isFinite(seconds)) {
        return;
      }
      const target = Math.max(0, duration > 0 ? Math.min(seconds, duration - 1) : seconds);
      engine.current?.seek(target);
      setPosition(target);
      reporting.seeked(target);
      controls.show();
    },
    [duration, reporting, controls],
  );

  const positionRef = useRef(position);
  positionRef.current = position;
  const skip = useCallback((seconds: number) => seekTo(positionRef.current + seconds), [seekTo]);

  const selectTrack = useCallback(
    (change: TrackChange) => {
      setMenuOpen(false);
      viewModel.send({
        kind: "selectTrack",
        change,
        positionTicks: secondsToTicks(positionRef.current),
      });
    },
    [viewModel],
  );

  useRemoteEvents((event: RemoteEvent) => {
    if (menuOpen || !REMOTE_KEYS.has(event.eventType)) {
      return;
    }
    switch (event.eventType) {
      case "playPause":
        togglePause();
        return;
      case "fastForward":
        skip(SKIP_FORWARD_SECONDS);
        return;
      case "rewind":
        skip(-SKIP_BACK_SECONDS);
        return;
      case "left":
      case "right":
        // With the controls hidden, or on the seek bar, left/right scrub instead of moving focus.
        if (!controls.visible || seekBarFocused.current) {
          skip(event.eventType === "left" ? -SCRUB_SECONDS : SCRUB_SECONDS);
          return;
        }
    }
    controls.show();
  });

  return (
    <View style={styles.container} onPointerMove={controls.show}>
      {source ? (
        <VideoEngine
          ref={engine}
          source={source}
          paused={paused}
          onLoad={(seconds) => {
            if (Number.isFinite(seconds) && seconds > 0) {
              setDuration(seconds);
            }
            setBuffering(false);
            reporting.loaded();
          }}
          onProgress={(seconds) => {
            setPosition(seconds);
            reporting.progressed(seconds);
          }}
          onBuffering={setBuffering}
          onEnd={() => navigation.goBack()}
          onError={setEngineError}
        />
      ) : null}

      {/* Tapping the video toggles the controls; not a focus target on TV. */}
      <Focusable
        focusable={false}
        accessibilityLabel={controls.visible ? "Hide controls" : "Show controls"}
        onPress={controls.visible ? controls.hide : controls.show}
        style={StyleSheet.absoluteFill}
      />

      {buffering && !errorMessage ? (
        <View pointerEvents="none" style={styles.center}>
          <ActivityIndicator size="large" color={theme.colors.white} />
        </View>
      ) : null}

      <PlayerControls
        visible={controls.visible}
        title={title}
        subtitle={subtitle}
        paused={paused}
        position={position}
        duration={duration}
        hasTracks={Boolean(source && (source.audioTracks.length > 1 || source.subtitleTracks.length > 0))}
        onTogglePause={togglePause}
        onSeek={seekTo}
        onSkip={skip}
        onOpenTracks={() => setMenuOpen(true)}
        onSeekBarFocusChange={(focused) => {
          seekBarFocused.current = focused;
        }}
      />

      {errorMessage ? (
        <View pointerEvents="none" style={styles.center}>
          <View style={styles.errorPanel}>
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        </View>
      ) : null}

      {menuOpen && source ? (
        <TrackMenu source={source} onSelect={selectTrack} onClose={() => setMenuOpen(false)} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.black,
  },
  center: {
    ...StyleSheet.absoluteFill,
    alignItems: "center",
    justifyContent: "center",
  },
  errorPanel: {
    maxWidth: 480,
    marginHorizontal: space(3),
    padding: space(2),
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.overlayStrong,
  },
  errorText: {
    ...theme.type.body,
    color: theme.colors.text,
    textAlign: "center",
  },
});
