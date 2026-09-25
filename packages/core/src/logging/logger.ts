//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

/** Log severity, mirroring swift-log's levels (subset used by the app). */
export type LogLevel = "trace" | "debug" | "info" | "warning" | "error" | "critical";

/**
 * Logging sink injected into core, mirroring Swiftfin's `Logger.swiftfin()`.
 * The app provides a concrete implementation (console/file); tests use `noopLogger`.
 */
export interface Logger {
    log(level: LogLevel, message: string, metadata?: Record<string, unknown>): void;
}

/** A logger that discards everything — the safe default before the app configures one. */
export const noopLogger: Logger = {
    log() {
        /* no-op */
    },
};

/** A logger backed by the global `console`, useful in development and Node tests. */
export const consoleLogger: Logger = {
    log(level, message, metadata) {
        const line = metadata ? `${message} ${JSON.stringify(metadata)}` : message;
        switch (level) {
            case "trace":
            case "debug":
                console.debug(line);
                break;
            case "info":
                console.info(line);
                break;
            case "warning":
                console.warn(line);
                break;
            case "error":
            case "critical":
                console.error(line);
                break;
        }
    },
};
