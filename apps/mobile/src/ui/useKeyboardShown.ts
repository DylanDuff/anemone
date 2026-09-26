//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { useEffect, useState } from "react";
import { Keyboard, type KeyboardEvent, Platform } from "react-native";

/** Used where the platform doesn't report the keyboard's own animation length (Android). */
const DEFAULT_DURATION_MS = 250;

/**
 * Whether the software keyboard is up, and how long its show/hide animation takes, so UI can move
 * in step with it. iOS reports the keyboard as it *starts* moving (`will…`); Android only once it
 * has (`did…`).
 */
export function useKeyboardShown(): { shown: boolean; durationMs: number } {
  const [state, setState] = useState({ shown: false, durationMs: DEFAULT_DURATION_MS });

  useEffect(() => {
    const ios = Platform.OS === "ios";
    const update = (shown: boolean) => (event: KeyboardEvent) =>
      setState({ shown, durationMs: event.duration || DEFAULT_DURATION_MS });
    const subscriptions = [
      Keyboard.addListener(ios ? "keyboardWillShow" : "keyboardDidShow", update(true)),
      Keyboard.addListener(ios ? "keyboardWillHide" : "keyboardDidHide", update(false)),
    ];
    return () => subscriptions.forEach((subscription) => subscription.remove());
  }, []);

  return state;
}
