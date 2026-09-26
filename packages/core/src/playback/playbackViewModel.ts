//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//
// The player screen's view model (Swiftfin `MediaPlayerManager`, first cut): negotiates the stream
// for an item and switches audio/subtitle tracks, re-negotiating when the stream has to change.
// Engine-agnostic — the UI binds a `PlaybackSource` to whichever engine it renders.
//

import type { QueryContext } from "../query/queryContext";
import {
    createStatefulStore,
    type StatefulStore,
    Transitions,
} from "../stateful/createStatefulStore";
import type { PlayerCapabilities } from "./capabilities";
import { type PlaybackSource, resolvePlayback } from "./playbackSource";
import { selectTrackLocally, type TrackChange } from "./trackSelection";

export type PlaybackState = "initial" | "loading" | "ready";
export type PlaybackBackgroundState = "switchingTrack";

export type PlaybackAction =
    | {
          readonly kind: "load";
          readonly startTicks?: number;
          readonly mediaSourceID?: string;
      }
    | {
          readonly kind: "selectTrack";
          readonly change: TrackChange;
          /** Where playback is now, so a re-negotiated stream resumes from here. */
          readonly positionTicks: number;
      };

export interface PlaybackData {
    /**
     * The stream to play. A new `playSessionID` means a new stream (end the old session's
     * reporting); the same one with other tracks means a switch within the stream.
     */
    readonly source: PlaybackSource | null;
}

export type PlaybackViewModel = StatefulStore<
    PlaybackState,
    PlaybackBackgroundState,
    PlaybackData,
    PlaybackAction,
    never
>;

export interface PlaybackViewModelOptions {
    readonly itemID: string;
    readonly capabilities: PlayerCapabilities;
    /** Bits per second; omit to let the server decide. */
    readonly maxBitrate?: number;
}

export function createPlaybackViewModel(
    ctx: QueryContext,
    options: PlaybackViewModelOptions,
): PlaybackViewModel {
    const { itemID, capabilities, maxBitrate } = options;
    // Negotiations can finish out of order (two quick track switches); only the latest applies.
    let latestRequest = 0;

    const negotiate = async (
        request: Omit<Parameters<typeof resolvePlayback>[1], "itemID" | "capabilities">,
        apply: (source: PlaybackSource) => void,
        signal: AbortSignal,
    ): Promise<void> => {
        const requestNumber = ++latestRequest;
        const source = await resolvePlayback(ctx, { ...request, itemID, capabilities });
        if (!signal.aborted && requestNumber === latestRequest) {
            apply(source);
        }
    };

    return createStatefulStore<
        PlaybackState,
        PlaybackBackgroundState,
        PlaybackData,
        PlaybackAction,
        never
    >({
        initialState: "initial",
        initialData: { source: null },
        transition(action) {
            switch (action.kind) {
                case "load":
                    return Transitions.to("loading", "ready");
                case "selectTrack":
                    return Transitions.background("switchingTrack");
            }
        },
        async handle(action, context) {
            switch (action.kind) {
                case "load":
                    await negotiate(
                        {
                            maxBitrate,
                            startTicks: action.startTicks,
                            mediaSourceID: action.mediaSourceID,
                        },
                        (source) => context.setData({ source }),
                        context.signal,
                    );
                    return;

                case "selectTrack": {
                    const current = context.getData().source;
                    if (!current) {
                        return;
                    }
                    const { change } = action;
                    const local = selectTrackLocally(current, change, capabilities);
                    if (local) {
                        latestRequest++; // supersede any negotiation still in flight
                        context.setData({ source: local });
                        return;
                    }

                    await negotiate(
                        {
                            maxBitrate,
                            mediaSourceID: current.mediaSourceID,
                            startTicks: action.positionTicks,
                            audioStreamIndex:
                                change.kind === "audio" ? change.index : current.audioStreamIndex,
                            subtitleStreamIndex:
                                change.kind === "subtitle"
                                    ? change.index
                                    : current.subtitleStreamIndex,
                        },
                        (source) => context.setData({ source }),
                        context.signal,
                    );
                    return;
                }
            }
        },
    });
}
