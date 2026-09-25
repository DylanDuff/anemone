//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

/**
 * A displayable error with a stable identity, mirroring Swiftfin's `ErrorMessage`.
 *
 * View models surface failures as `ErrorMessage` so the UI has a consistent shape to render,
 * rather than leaking arbitrary `Error`/`unknown` values from the network layer.
 */
export class ErrorMessage extends Error {
    /** Optional machine code (e.g. an HTTP status or server error code). */
    readonly code: number | undefined;

    constructor(message: string, code?: number) {
        super(message);
        this.name = "ErrorMessage";
        this.code = code;
    }

    /**
     * Coerce any thrown value into an `ErrorMessage`. Extracts an HTTP status and the best
     * available message from an Axios-shaped error without importing axios into core.
     */
    static from(error: unknown, fallback = "An unknown error has occurred."): ErrorMessage {
        if (error instanceof ErrorMessage) {
            return error;
        }

        // Axios-shaped error (duck-typed to avoid a hard axios dependency here).
        if (typeof error === "object" && error !== null) {
            const anyError = error as {
                response?: { status?: number; data?: unknown };
                message?: string;
            };
            const status = anyError.response?.status;
            const data = anyError.response?.data;
            const serverMessage =
                typeof data === "string"
                    ? data
                    : typeof data === "object" && data !== null && "Message" in data
                      ? String((data as { Message?: unknown }).Message ?? "")
                      : undefined;

            const message = serverMessage || anyError.message || fallback;
            return new ErrorMessage(message, status);
        }

        if (error instanceof Error) {
            return new ErrorMessage(error.message || fallback);
        }

        return new ErrorMessage(fallback);
    }
}
