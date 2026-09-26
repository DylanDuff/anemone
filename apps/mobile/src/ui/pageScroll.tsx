//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { createContext, useCallback, useContext, useSyncExternalStore } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

/** How far a page must scroll in one direction before the pill changes size. */
const DIRECTION_THRESHOLD = 12;
/** Within this distance of the top the pill is always full size. */
const TOP_ZONE = 24;

/**
 * Whether to minimise the pill, from the page's scrolling (as iOS tab bars do): scrolling down
 * minimises it, scrolling back up or reaching the top restores it. Kept outside React state so
 * scrolling re-renders only the pill (`useScrollMinimized`), never the shell or its pages.
 */
export class ScrollMinimizeStore {
  private minimized = false;
  // Where the current run of scrolling in one direction began, and the latest offset.
  private anchor = 0;
  private last = 0;
  private readonly listeners = new Set<() => void>();

  readonly report = (offset: number): void => {
    const scrollingDown = offset > this.last;
    const wasScrollingDown = this.last > this.anchor;
    if (scrollingDown !== wasScrollingDown) {
      this.anchor = this.last;
    }
    this.last = offset;

    if (offset <= TOP_ZONE) {
      this.set(false);
    } else if (offset - this.anchor > DIRECTION_THRESHOLD) {
      this.set(true);
    } else if (this.anchor - offset > DIRECTION_THRESHOLD) {
      this.set(false);
    }
  };

  /** Full size again for a new page, which starts at the top without scrolling. */
  readonly reset = (): void => {
    this.anchor = 0;
    this.last = 0;
    this.set(false);
  };

  readonly subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  readonly isMinimized = (): boolean => this.minimized;

  private set(minimized: boolean): void {
    if (minimized !== this.minimized) {
      this.minimized = minimized;
      this.listeners.forEach((listener) => listener());
    }
  }
}

/** Whether the pill is minimised; re-renders only the caller, only when it flips. */
export function useScrollMinimized(store: ScrollMinimizeStore): boolean {
  return useSyncExternalStore(store.subscribe, store.isMinimized);
}

const PageScrollContext = createContext<((offset: number) => void) | null>(null);

/** Carries a browse page's scroll offset up to the shell's `ScrollMinimizeStore`. */
export const PageScrollProvider = PageScrollContext.Provider;

/**
 * `onScroll` for a browse page's main scroll view, so the navigation pill can shrink while reading
 * down the page. Pair it with `scrollEventThrottle={16}`. A no-op outside the browse shell.
 */
export function usePageScrollHandler(): (event: NativeSyntheticEvent<NativeScrollEvent>) => void {
  const report = useContext(PageScrollContext);
  return useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => report?.(event.nativeEvent.contentOffset.y),
    [report],
  );
}
