//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { createContext, createElement, type ReactNode, useContext, useEffect } from "react";
import { useStore } from "zustand";
import type { AnemoneContainer } from "../container/container";
import { SessionController } from "../session/sessionController";
import type { UserSession } from "../session/userSession";
import { type QueryContext, queryContextFromSession } from "../query/queryContext";

interface AnemoneContextValue {
    readonly container: AnemoneContainer;
    readonly sessionController: SessionController;
}

const AnemoneContext = createContext<AnemoneContextValue | null>(null);

export interface AnemoneProviderProps {
    readonly container: AnemoneContainer;
    /** Provide a controller explicitly (e.g. in tests); otherwise one is created per container. */
    readonly sessionController?: SessionController;
    readonly children?: ReactNode;
}

/**
 * Provides the core `container` and a reactive `SessionController` to the React tree. Mount inside
 * the app's `QueryClientProvider`. On mount it resolves the current session once.
 */
export function AnemoneProvider(props: AnemoneProviderProps) {
    const sessionController =
        props.sessionController ?? new SessionController(props.container);

    useEffect(() => {
        void sessionController.refresh();
    }, [sessionController]);

    return createElement(
        AnemoneContext.Provider,
        { value: { container: props.container, sessionController } },
        props.children,
    );
}

function useAnemoneContext(): AnemoneContextValue {
    const value = useContext(AnemoneContext);
    if (!value) {
        throw new Error("useAnemone* hooks must be used within an <AnemoneProvider>.");
    }
    return value;
}

/** The core dependency container. */
export function useContainer(): AnemoneContainer {
    return useAnemoneContext().container;
}

/** The reactive session controller. */
export function useSessionController(): SessionController {
    return useAnemoneContext().sessionController;
}

/** The current session snapshot (`session` is null when signed out). */
export function useCurrentSession(): { session: UserSession | null; isLoading: boolean } {
    const controller = useSessionController();
    return useStore(controller.store);
}

/**
 * A `QueryContext` for the current session, for building queries. Throws if there is no signed-in
 * session — call it only from screens rendered behind an authenticated boundary.
 */
export function useQueryContext(): QueryContext {
    const { session } = useCurrentSession();
    if (!session) {
        throw new Error("useQueryContext requires a signed-in session.");
    }
    return queryContextFromSession(session);
}
