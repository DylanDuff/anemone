//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { describe, expect, it } from "vitest";
import { describeError } from "../src/errors/describeError";

/** An Axios-shaped error that got an HTTP response. */
function httpError(status: number, data?: unknown) {
    return { message: `Request failed with status code ${status}`, response: { status, data } };
}

describe("describeError", () => {
    it("treats a request with no response as the server being unreachable", () => {
        const described = describeError({ message: "Network Error", code: "ERR_NETWORK" }, "thinky");
        expect(described.kind).toBe("offline");
        expect(described.message).toContain("thinky");
        expect(describeError({ code: "ECONNABORTED", message: "timeout" }).kind).toBe("offline");
        expect(describeError({ code: "ERR_NETWORK" }).message).toContain("your server");
    });

    it("recognises signed-out, not-found and server faults by status", () => {
        expect(describeError(httpError(401)).kind).toBe("unauthorized");
        expect(describeError(httpError(404)).kind).toBe("notFound");
        const server = describeError(httpError(503));
        expect(server.kind).toBe("server");
        expect(server.message).toContain("503");
    });

    it("falls back to the server's or error's own message", () => {
        expect(describeError(httpError(400, { Message: "Bad filter" }))).toEqual({
            kind: "unknown",
            title: "Something went wrong",
            message: "Bad filter",
        });
        expect(describeError(new Error("boom")).message).toBe("boom");
    });

    it("doesn't mistake an HTTP error for being offline", () => {
        expect(describeError({ code: "ERR_NETWORK", ...httpError(500) }).kind).toBe("server");
    });
});
