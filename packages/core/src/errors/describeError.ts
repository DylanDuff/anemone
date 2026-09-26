//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { ErrorMessage } from "./errorMessage";

/** What kind of failure it was, for picking an icon or a recovery action. */
export type ErrorKind = "offline" | "unauthorized" | "notFound" | "server" | "unknown";

/** A failure explained for people: a short title and one line on what to do. */
export interface ErrorDescription {
    readonly kind: ErrorKind;
    readonly title: string;
    readonly message: string;
}

/** Axios error codes for requests that never got a response. */
const NO_RESPONSE_CODES = new Set(["ERR_NETWORK", "ECONNABORTED", "ETIMEDOUT", "ECONNREFUSED"]);

function hasNoResponse(error: unknown): boolean {
    if (typeof error !== "object" || error === null) {
        return false;
    }
    const candidate = error as { response?: unknown; code?: unknown; message?: unknown };
    if (candidate.response != null) {
        return false;
    }
    return (
        (typeof candidate.code === "string" && NO_RESPONSE_CODES.has(candidate.code)) ||
        candidate.message === "Network Error"
    );
}

/**
 * Turn a failed request into something a person can act on: can't reach the server, signed out,
 * gone, or a server fault — otherwise the best message available. `serverName` personalises the
 * "can't reach" hint.
 */
export function describeError(error: unknown, serverName?: string): ErrorDescription {
    if (hasNoResponse(error)) {
        return {
            kind: "offline",
            title: "Can't reach the server",
            message: `Check your connection and that ${serverName ?? "your server"} is online.`,
        };
    }

    const { code, message } = ErrorMessage.from(error);
    if (code === 401) {
        return {
            kind: "unauthorized",
            title: "You've been signed out",
            message: "Your session on the server has ended. Sign out in Settings and sign in again.",
        };
    }
    if (code === 404) {
        return {
            kind: "notFound",
            title: "Not found",
            message: "It may have been removed from the server.",
        };
    }
    if (code != null && code >= 500) {
        return {
            kind: "server",
            title: "The server ran into a problem",
            message: `It responded with error ${code}. Try again in a moment.`,
        };
    }
    return { kind: "unknown", title: "Something went wrong", message };
}
