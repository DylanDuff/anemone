//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { createStore, type StoreApi } from "zustand/vanilla";
import { ErrorMessage } from "../errors/errorMessage";
import { EventBus } from "./eventBus";

/**
 * A state transition for an action, mirroring Swiftfin's `@Stateful` macro `Transition`:
 *
 * - `to(state)`      — move to `state` immediately (used for synchronous actions like "cancel").
 * - `loop(state)`    — enter `state` while the async handler runs, then return to the resting state.
 * - `background(bg)` — add `bg` to `backgroundStates` while the handler runs (primary state
 *                      unchanged), used for refreshes that shouldn't block the UI.
 * - `none`           — no state change; just run the handler / emit events.
 */
export type Transition<State, BackgroundState> =
    | { readonly kind: "to"; readonly state: State; readonly then?: State }
    | { readonly kind: "loop"; readonly state: State }
    | { readonly kind: "background"; readonly state: BackgroundState }
    | { readonly kind: "none" };

export const Transitions = {
    /**
     * Move to `state` immediately. If `then` is given, move to it when the handler succeeds
     * (e.g. `to("loading", "content")`). On failure the state stays at `state` and the error is
     * recorded on the store.
     */
    to<State, BG>(state: State, then?: State): Transition<State, BG> {
        return then === undefined ? { kind: "to", state } : { kind: "to", state, then };
    },
    loop<State, BG>(state: State): Transition<State, BG> {
        return { kind: "loop", state };
    },
    background<State, BG>(state: BG): Transition<State, BG> {
        return { kind: "background", state };
    },
    none<State, BG>(): Transition<State, BG> {
        return { kind: "none" };
    },
} as const;

/** The observable snapshot of a stateful store. */
export interface StatefulSnapshot<State, BackgroundState, Data> {
    readonly state: State;
    readonly backgroundStates: ReadonlySet<BackgroundState>;
    readonly data: Data;
    readonly error: ErrorMessage | null;
}

/** Context handed to an action handler. */
export interface StatefulContext<Data, Event> {
    /** Current data snapshot. */
    getData(): Data;
    /** Merge a partial update into `data`, notifying subscribers. */
    setData(update: Partial<Data> | ((current: Data) => Partial<Data>)): void;
    /** Emit a one-shot event. */
    emit(event: Event): void;
    /** Aborted if a newer dispatch supersedes this one, or the store is disposed. */
    readonly signal: AbortSignal;
}

export interface StatefulConfig<State, BackgroundState, Data, Action, Event> {
    initialState: State;
    initialData: Data;
    /** Map an action to its state transition. */
    transition(action: Action): Transition<State, BackgroundState>;
    /** Perform the (possibly async) work for an action. Throw to surface an error. */
    handle(action: Action, context: StatefulContext<Data, Event>): Promise<void> | void;
}

/**
 * A framework-agnostic reducer store implementing Swiftfin's `Stateful`/`@Stateful` contract.
 *
 * `send(action)` applies the action's transition, runs its handler, and on failure records an
 * `ErrorMessage` (and emits it on the event bus as `{ kind: "error" }`-shaped events are the VM's
 * concern — the raw error is always available via `getError()`). Handlers receive an `AbortSignal`
 * that fires when a newer dispatch supersedes the in-flight one or the store is disposed.
 *
 * React consumers bind to it with `useStateful` (see `useStateful.ts`).
 */
export class StatefulStore<State, BackgroundState, Data, Action, Event> {
    readonly events = new EventBus<Event>();
    readonly store: StoreApi<StatefulSnapshot<State, BackgroundState, Data>>;

    private readonly config: StatefulConfig<State, BackgroundState, Data, Action, Event>;
    private generation = 0;
    private controllers = new Set<AbortController>();
    private disposed = false;

    constructor(config: StatefulConfig<State, BackgroundState, Data, Action, Event>) {
        this.config = config;
        this.store = createStore<StatefulSnapshot<State, BackgroundState, Data>>(() => ({
            state: config.initialState,
            backgroundStates: new Set<BackgroundState>(),
            data: config.initialData,
            error: null,
        }));
    }

    getState(): State {
        return this.store.getState().state;
    }

    getData(): Data {
        return this.store.getState().data;
    }

    getBackgroundStates(): ReadonlySet<BackgroundState> {
        return this.store.getState().backgroundStates;
    }

    getError(): ErrorMessage | null {
        return this.store.getState().error;
    }

    /** Dispatch an action. Fire-and-forget; observe results via the store snapshot / events. */
    send(action: Action): void {
        if (this.disposed) {
            return;
        }

        const transition = this.config.transition(action);
        const restingState = this.store.getState().state;
        const generation = ++this.generation;

        const controller = new AbortController();
        this.controllers.add(controller);

        // Apply the entering side of the transition.
        switch (transition.kind) {
            case "to":
                this.store.setState({ state: transition.state, error: null });
                break;
            case "loop":
                this.store.setState({ state: transition.state, error: null });
                break;
            case "background":
                this.updateBackgroundStates((set) => set.add(transition.state));
                break;
            case "none":
                this.store.setState({ error: null });
                break;
        }

        const context: StatefulContext<Data, Event> = {
            getData: () => this.store.getState().data,
            setData: (update) => {
                const current = this.store.getState().data;
                const patch = typeof update === "function" ? update(current) : update;
                this.store.setState({ data: { ...current, ...patch } });
            },
            emit: (event) => this.events.emit(event),
            signal: controller.signal,
        };

        const isCurrent = () => generation === this.generation && !this.disposed;

        const settle = (success: boolean) => {
            this.controllers.delete(controller);
            if (transition.kind === "background") {
                this.updateBackgroundStates((set) => set.delete(transition.state));
                return;
            }
            if (!isCurrent()) {
                // A newer dispatch has taken over; don't clobber its state.
                return;
            }
            if (transition.kind === "loop") {
                // Always return to the resting state we left (success or failure).
                this.store.setState({ state: restingState });
            } else if (success && transition.kind === "to" && transition.then !== undefined) {
                // Advance to the success state only when the handler succeeded.
                this.store.setState({ state: transition.then });
            }
        };

        const onError = (error: unknown) => {
            if (controller.signal.aborted || this.disposed) {
                return;
            }
            const message = ErrorMessage.from(error);
            this.store.setState({ error: message });
        };

        try {
            const result = this.config.handle(action, context);
            if (result instanceof Promise) {
                result.then(
                    () => settle(true),
                    (error) => {
                        onError(error);
                        settle(false);
                    },
                );
            } else {
                settle(true);
            }
        } catch (error) {
            onError(error);
            settle(false);
        }
    }

    /** Abort every in-flight handler (e.g. on unmount). */
    cancelAll(): void {
        this.generation++;
        for (const controller of this.controllers) {
            controller.abort();
        }
        this.controllers.clear();
    }

    /** Cancel everything and release listeners. */
    dispose(): void {
        this.disposed = true;
        this.cancelAll();
        this.events.clear();
    }

    private updateBackgroundStates(mutate: (set: Set<BackgroundState>) => void): void {
        const next = new Set(this.store.getState().backgroundStates);
        mutate(next);
        this.store.setState({ backgroundStates: next });
    }
}

/** Convenience factory mirroring a "create view model" call. */
export function createStatefulStore<State, BackgroundState, Data, Action, Event>(
    config: StatefulConfig<State, BackgroundState, Data, Action, Event>,
): StatefulStore<State, BackgroundState, Data, Action, Event> {
    return new StatefulStore(config);
}
