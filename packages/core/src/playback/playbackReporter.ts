//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// Tells the server what's playing (Swiftfin `MediaProgressObserver`): start, periodic progress,
// and stop. The server uses these for resume positions, played state, "now playing" on the
// dashboard, and to end the transcode for a play session.
//

import type { PlaybackProgressInfo } from "@jellyfin/sdk/lib/generated-client/models/playback-progress-info";
import { getSessionApi } from "../jellyfin/api";
import type { Api } from "../jellyfin/client";
import { type Logger, noopLogger } from "../logging/logger";
import type { PlaybackSource } from "./playbackSource";

export interface PlaybackProgress {
    readonly positionTicks: number;
    readonly isPaused: boolean;
}

export interface PlaybackReporterOptions {
    /** Minimum time between routine progress reports. Default 10 seconds. */
    readonly intervalMs?: number;
    /** Clock, injectable for tests. */
    readonly now?: () => number;
    readonly logger?: Logger;
}

type Phase = "idle" | "playing" | "stopped";

/**
 * Reports one play session. Engines emit progress several times a second; `progressed` throttles
 * that to one report per interval, while `changed` (pause, seek, track switch) reports at once.
 * Failures are logged, never thrown — reporting must not interrupt playback.
 */
export class PlaybackReporter {
    private readonly api: Api;
    private source: PlaybackSource;
    private readonly intervalMs: number;
    private readonly now: () => number;
    private readonly logger: Logger;
    private phase: Phase = "idle";
    private lastReportAt = 0;

    constructor(api: Api, source: PlaybackSource, options: PlaybackReporterOptions = {}) {
        this.api = api;
        this.source = source;
        this.intervalMs = options.intervalMs ?? 10_000;
        this.now = options.now ?? Date.now;
        this.logger = options.logger ?? noopLogger;
    }

    private info(progress: PlaybackProgress): PlaybackProgressInfo {
        const source = this.source;
        return {
            ItemId: source.itemID,
            MediaSourceId: source.mediaSourceID,
            PlaySessionId: source.playSessionID,
            PlayMethod: source.method,
            PositionTicks: Math.round(progress.positionTicks),
            IsPaused: progress.isPaused,
            AudioStreamIndex: source.audioStreamIndex ?? null,
            SubtitleStreamIndex: source.subtitleStreamIndex,
            CanSeek: true,
        };
    }

    private async send(label: string, request: () => Promise<unknown>): Promise<void> {
        this.lastReportAt = this.now();
        try {
            await request();
        } catch (error) {
            this.logger.log("warning", `Playback ${label} report failed`, {
                error: String(error),
            });
        }
    }

    async started(progress: PlaybackProgress): Promise<void> {
        if (this.phase !== "idle") {
            return;
        }
        this.phase = "playing";
        const info = this.info(progress);
        await this.send("start", () =>
            getSessionApi(this.api).reportPlaybackStart({ playbackStartInfo: info }),
        );
    }

    /** Routine progress from the engine; reported at most once per interval. */
    async progressed(progress: PlaybackProgress): Promise<void> {
        if (this.phase !== "playing" || this.now() - this.lastReportAt < this.intervalMs) {
            return;
        }
        await this.report(progress);
    }

    /**
     * A pause, resume, seek or track switch: reported immediately. Pass `source` when a track was
     * switched within the same stream so the report carries the new track indices.
     */
    async changed(progress: PlaybackProgress, source?: PlaybackSource): Promise<void> {
        if (source) {
            this.source = source;
        }
        if (this.phase !== "playing") {
            return;
        }
        await this.report(progress);
    }

    private async report(progress: PlaybackProgress): Promise<void> {
        const info = this.info(progress);
        await this.send("progress", () =>
            getSessionApi(this.api).reportPlaybackProgress({ playbackProgressInfo: info }),
        );
    }

    /** End the session. Safe to call more than once; only the first call reports. */
    async stopped(progress: PlaybackProgress): Promise<void> {
        if (this.phase !== "playing") {
            this.phase = "stopped";
            return;
        }
        this.phase = "stopped";
        const { PositionTicks, ItemId, MediaSourceId, PlaySessionId } = this.info(progress);
        await this.send("stop", () =>
            getSessionApi(this.api).reportPlaybackStopped({
                playbackStopInfo: { ItemId, MediaSourceId, PlaySessionId, PositionTicks },
            }),
        );
    }
}
