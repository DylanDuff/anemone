//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// TV focus/remote APIs from react-native-tvos, behind names the rest of the app uses. The web build
// resolves `tv.web.tsx` instead, since react-native-web has no TV APIs.
//

import { useEffect, useRef } from "react";
import {
  BackHandler,
  type HWEvent,
  Platform,
  TVFocusGuideView,
  useTVEventHandler,
} from "react-native";

export type RemoteEvent = HWEvent;

/** Whether this is a TV build (Android TV / Apple TV). */
export const isTV = Platform.isTV;

/**
 * A region that steers D-pad focus: `autoFocus` returns focus to the last focused child when
 * re-entered (rows remember your place); `trapFocus*` stops focus leaving in that direction.
 */
export const FocusGuide = TVFocusGuideView;

/** Subscribe to raw remote/D-pad events (`left`, `right`, `select`, …). */
export function useRemoteEvents(handler: (event: RemoteEvent) => void): void {
  useTVEventHandler(handler);
}

/**
 * While `enabled`, the remote's (or phone's) Back button calls `handler` instead of navigating
 * back / leaving the app. Use for transient UI (an open rail, a menu) that Back should dismiss.
 */
export function useHardwareBack(enabled: boolean, handler: () => void): void {
  const latest = useRef(handler);
  latest.current = handler;

  useEffect(() => {
    if (!enabled) {
      return;
    }
    const subscription = BackHandler.addEventListener("hardwareBackPress", () => {
      latest.current();
      return true;
    });
    return () => subscription.remove();
  }, [enabled]);
}
