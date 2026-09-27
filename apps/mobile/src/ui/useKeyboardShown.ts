//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { useEffect, useState } from "react";
import { Keyboard, type KeyboardEvent, Platform } from "react-native";

/** Used where the platform doesn't report the keyboard's own animation length (Android). */
const DEFAULT_DURATION_MS = 250;

export interface KeyboardState {
  readonly shown: boolean;
  /** How far the keyboard covers the bottom of the screen (0 while hidden). */
  readonly height: number;
  readonly durationMs: number;
}

/**
 * Whether the software keyboard is up, how tall it is, and how long its show/hide animation takes,
 * so UI can move in step with it. iOS reports the keyboard as it *starts* moving (`will…`);
 * Android only once it has (`did…`).
 */
export function useKeyboardShown(): KeyboardState {
  const [state, setState] = useState<KeyboardState>({
    shown: false,
    height: 0,
    durationMs: DEFAULT_DURATION_MS,
  });

  useEffect(() => {
    const ios = Platform.OS === "ios";
    const update = (shown: boolean) => (event: KeyboardEvent) =>
      setState({
        shown,
        height: shown ? event.endCoordinates.height : 0,
        durationMs: event.duration || DEFAULT_DURATION_MS,
      });
    const subscriptions = [
      Keyboard.addListener(ios ? "keyboardWillShow" : "keyboardDidShow", update(true)),
      Keyboard.addListener(ios ? "keyboardWillHide" : "keyboardDidHide", update(false)),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  return state;
}
