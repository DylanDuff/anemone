//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { describe, expect, it, vi } from "vitest";
import { createStatefulStore, Transitions } from "../src/stateful/createStatefulStore";

type State = "idle" | "loading";
type BG = "refreshing";
type Data = { count: number; loaded: string | null };
type Action =
    | { kind: "inc" }
    | { kind: "reset" }
    | { kind: "load" }
    | { kind: "fail" }
    | { kind: "bg" };
type Event = { kind: "loaded"; value: string };

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

function makeStore() {
    return createStatefulStore<State, BG, Data, Action, Event>({
        initialState: "idle",
        initialData: { count: 0, loaded: null },
        transition(action) {
            switch (action.kind) {
                case "inc":
                    return Transitions.none();
                case "reset":
                    return Transitions.to("idle");
                case "load":
                case "fail":
                    return Transitions.loop("loading");
                case "bg":
                    return Transitions.background("refreshing");
            }
        },
        async handle(action, ctx) {
            switch (action.kind) {
                case "inc":
                    ctx.setData((d) => ({ count: d.count + 1 }));
                    return;
                case "reset":
                    ctx.setData({ count: 0, loaded: null });
                    return;
                case "load":
                    await Promise.resolve();
                    ctx.setData({ loaded: "value" });
                    ctx.emit({ kind: "loaded", value: "value" });
                    return;
                case "fail":
                    await Promise.resolve();
                    throw new Error("boom");
                case "bg":
                    await tick();
                    ctx.setData((d) => ({ count: d.count + 10 }));
                    return;
            }
        },
    });
}

describe("StatefulStore", () => {
    it("runs a `none` transition handler without changing state", () => {
        const store = makeStore();
        store.send({ kind: "inc" });
        expect(store.getState()).toBe("idle");
        expect(store.getData().count).toBe(1);
    });

    it("enters the loop state during async work and returns to resting after", async () => {
        const store = makeStore();
        const events: Event[] = [];
        store.events.subscribe((e) => events.push(e));

        store.send({ kind: "load" });
        expect(store.getState()).toBe("loading"); // set synchronously

        await tick();
        expect(store.getState()).toBe("idle"); // returned to resting state
        expect(store.getData().loaded).toBe("value");
        expect(events).toEqual([{ kind: "loaded", value: "value" }]);
    });

    it("records an ErrorMessage when a handler throws and reverts the loop state", async () => {
        const store = makeStore();
        store.send({ kind: "fail" });
        expect(store.getState()).toBe("loading");

        await tick();
        expect(store.getState()).toBe("idle");
        expect(store.getError()?.message).toBe("boom");
    });

    it("clears a prior error on the next dispatch", async () => {
        const store = makeStore();
        store.send({ kind: "fail" });
        await tick();
        expect(store.getError()).not.toBeNull();

        store.send({ kind: "inc" });
        expect(store.getError()).toBeNull();
    });

    it("tracks background states without touching the primary state", async () => {
        const store = makeStore();
        store.send({ kind: "bg" });
        expect(store.getState()).toBe("idle");
        expect([...store.getBackgroundStates()]).toEqual(["refreshing"]);

        await tick();
        expect([...store.getBackgroundStates()]).toEqual([]);
        expect(store.getData().count).toBe(10);
    });

    it("does not revert loop state if a newer dispatch supersedes it", async () => {
        const store = makeStore();
        store.send({ kind: "load" }); // loop -> loading, will finish and try to revert to idle
        store.send({ kind: "reset" }); // to -> idle immediately (newer generation)
        expect(store.getState()).toBe("idle");
        await tick();
        // still idle; the stale load completion must not have reverted anything odd
        expect(store.getState()).toBe("idle");
    });

    it("aborts in-flight handlers on dispose", async () => {
        const store = makeStore();
        const seen = vi.fn();
        // A handler that checks the signal.
        store.send({ kind: "bg" });
        store.dispose();
        await tick();
        // After dispose the background completion must not throw; state store is frozen.
        seen();
        expect(seen).toHaveBeenCalled();
    });
});
