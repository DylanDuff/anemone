//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

/**
 * A minimal typed event emitter for one-shot view-model events, replacing Swiftfin's Combine
 * `PassthroughSubject` `events`. Unlike state, events are not retained — a subscriber only receives
 * events emitted after it subscribes (e.g. "connected", "saved", "error").
 */
export class EventBus<Event> {
    private readonly listeners = new Set<(event: Event) => void>();

    subscribe(listener: (event: Event) => void): () => void {
        this.listeners.add(listener);
        return () => {
            this.listeners.delete(listener);
        };
    }

    emit(event: Event): void {
        for (const listener of [...this.listeners]) {
            listener(event);
        }
    }

    clear(): void {
        this.listeners.clear();
    }
}
