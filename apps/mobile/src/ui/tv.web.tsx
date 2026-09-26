//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// Web stand-ins for `tv.ts`: react-native-web has no TV focus APIs, so guides are plain Views and
// remote events never fire. Keyboard focus still works through `Focusable`.
//

import { forwardRef } from "react";
import { View, type ViewProps } from "react-native";

export type RemoteEvent = { eventType: string };

export const isTV = false;

type FocusGuideProps = ViewProps & {
  autoFocus?: boolean;
  trapFocusUp?: boolean;
  trapFocusDown?: boolean;
  trapFocusLeft?: boolean;
  trapFocusRight?: boolean;
};

export const FocusGuide = forwardRef<View, FocusGuideProps>(function FocusGuide(
  { autoFocus: _autoFocus, trapFocusUp: _up, trapFocusDown: _down, trapFocusLeft: _left, trapFocusRight: _right, ...props },
  ref,
) {
  return <View ref={ref} {...props} />;
});

export function useRemoteEvents(_handler: (event: RemoteEvent) => void): void {
  // No remote on web.
}

export function useHardwareBack(_enabled: boolean, _handler: () => void): void {
  // No hardware Back on web; the browser's back button drives navigation history.
}
