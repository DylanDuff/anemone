//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { useEffect, useRef } from "react";
import { useStore } from "zustand";
import type { StatefulSnapshot, StatefulStore } from "./createStatefulStore";

/**
 * Subscribe a React component to a `StatefulStore`, returning its live snapshot plus `send` and the
 * event bus. The store itself should be created once (e.g. via `useRef`/`useMemo` or a provider) so
 * its identity is stable across renders.
 */
export function useStateful<State, BackgroundState, Data, Action, Event>(
    store: StatefulStore<State, BackgroundState, Data, Action, Event>,
): StatefulSnapshot<State, BackgroundState, Data> & {
    send: (action: Action) => void;
    events: StatefulStore<State, BackgroundState, Data, Action, Event>["events"];
} {
    const snapshot = useStore(store.store);

    return {
        ...snapshot,
        send: (action: Action) => store.send(action),
        events: store.events,
    };
}

/**
 * Subscribe to a store's one-shot events for the lifetime of the component. The handler is not
 * expected to be stable; the latest handler is always used.
 */
export function useStatefulEvents<State, BackgroundState, Data, Action, Event>(
    store: StatefulStore<State, BackgroundState, Data, Action, Event>,
    handler: (event: Event) => void,
): void {
    const handlerRef = useRef(handler);
    handlerRef.current = handler;

    useEffect(() => {
        const unsubscribe = store.events.subscribe((event) => handlerRef.current(event));
        return unsubscribe;
    }, [store]);
}
