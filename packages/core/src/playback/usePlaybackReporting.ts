//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// Binds a `PlaybackReporter` to a player screen's lifecycle: one reporting session per stream
// (`playSessionID`), ended when the stream is replaced or the screen goes away.
//

import { useEffect, useMemo, useRef } from "react";
import { secondsToTicks } from "../jellyfin/ticks";
import { useRefreshUserItemData } from "../query/hooks";
import { useContainer, useQueryContext } from "../react/context";
import { type PlaybackProgress, PlaybackReporter } from "./playbackReporter";
import type { PlaybackSource } from "./playbackSource";

/** Engine events to forward. Positions are in seconds, as engines report them. */
export interface PlaybackReporting {
    /** The engine has loaded the stream and is starting. */
    loaded(): void;
    progressed(positionSeconds: number): void;
    pausedChanged(isPaused: boolean): void;
    seeked(positionSeconds: number): void;
}

export function usePlaybackReporting(source: PlaybackSource | null): PlaybackReporting {
    const { api } = useQueryContext();
    const { logger } = useContainer();
    const refreshUserItemData = useRefreshUserItemData();
    const reporter = useRef<PlaybackReporter | null>(null);
    const progress = useRef<PlaybackProgress>({
        positionTicks: source?.startTicks ?? 0,
        isPaused: false,
    });

    const sessionID = source?.playSessionID;
    // A new stream: start a new reporting session, ending the previous one (which also ends its
    // server-side transcode). `source` is read only when the session changes.
    useEffect(() => {
        if (!source) {
            return;
        }
        const current = new PlaybackReporter(api, source, { logger });
        reporter.current = current;
        return () => {
            reporter.current = null;
            void current.stopped(progress.current).then(refreshUserItemData);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionID, api, logger, refreshUserItemData]);

    // The same stream with other tracks selected: report the new selection.
    useEffect(() => {
        if (source) {
            void reporter.current?.changed(progress.current, source);
        }
    }, [source]);

    return useMemo(() => {
        const update = (patch: Partial<PlaybackProgress>) => {
            progress.current = { ...progress.current, ...patch };
        };
        return {
            loaded() {
                void reporter.current?.started(progress.current);
            },
            progressed(positionSeconds) {
                update({ positionTicks: secondsToTicks(positionSeconds) });
                void reporter.current?.progressed(progress.current);
            },
            pausedChanged(isPaused) {
                update({ isPaused });
                void reporter.current?.changed(progress.current);
            },
            seeked(positionSeconds) {
                update({ positionTicks: secondsToTicks(positionSeconds) });
                void reporter.current?.changed(progress.current);
            },
        };
    }, []);
}
