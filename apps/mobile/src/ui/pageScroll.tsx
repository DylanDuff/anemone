//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { createContext, useCallback, useContext, useRef, useState } from "react";
import type { NativeScrollEvent, NativeSyntheticEvent } from "react-native";

/** How far a page must scroll in one direction before the pill changes size. */
const DIRECTION_THRESHOLD = 12;
/** Within this distance of the top the pill is always full size. */
const TOP_ZONE = 24;

const PageScrollContext = createContext<((offset: number) => void) | null>(null);

/** Carries a browse page's scroll offset up to the shell (see `useScrollMinimize`). */
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

/**
 * Whether to minimise the pill, from the page's scrolling (as iOS tab bars do): scrolling down
 * minimises it, scrolling back up or reaching the top restores it. `reset` restores it for a new
 * page, which starts at the top without scrolling.
 */
export function useScrollMinimize(): {
  minimized: boolean;
  report: (offset: number) => void;
  reset: () => void;
} {
  const [minimized, setMinimized] = useState(false);
  // Where the current run of scrolling in one direction began.
  const anchor = useRef(0);
  const last = useRef(0);

  const report = useCallback((offset: number) => {
    const scrollingDown = offset > last.current;
    const wasScrollingDown = last.current > anchor.current;
    if (scrollingDown !== wasScrollingDown) {
      anchor.current = last.current;
    }
    last.current = offset;

    if (offset <= TOP_ZONE) {
      setMinimized(false);
    } else if (offset - anchor.current > DIRECTION_THRESHOLD) {
      setMinimized(true);
    } else if (anchor.current - offset > DIRECTION_THRESHOLD) {
      setMinimized(false);
    }
  }, []);

  const reset = useCallback(() => {
    anchor.current = 0;
    last.current = 0;
    setMinimized(false);
  }, []);

  return { minimized, report, reset };
}
