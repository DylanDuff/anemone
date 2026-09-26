//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Visibility for player controls: shown on interaction, hidden after `delayMs` without any, and
 * held visible while `pinned` (paused, a menu open, an error showing).
 */
export function useAutoHide(pinned: boolean, delayMs = 4000) {
  const [visible, setVisible] = useState(true);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;

  const show = useCallback(() => {
    setVisible(true);
    clearTimeout(timer.current);
    if (!pinnedRef.current) {
      timer.current = setTimeout(() => setVisible(false), delayMs);
    }
  }, [delayMs]);

  const hide = useCallback(() => {
    clearTimeout(timer.current);
    if (!pinnedRef.current) {
      setVisible(false);
    }
  }, []);

  // Unpinning starts the countdown again; pinning cancels it.
  useEffect(() => {
    show();
    return () => clearTimeout(timer.current);
  }, [pinned, show]);

  return { visible, show, hide };
}
