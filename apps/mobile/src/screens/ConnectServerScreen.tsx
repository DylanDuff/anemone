//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  createConnectToServerViewModel,
  type ServerState,
  useContainer,
  useStateful,
  useStatefulEvents,
} from "@anemone/core";
import { useEffect, useMemo, useRef } from "react";
import { Button } from "../ui/Button";
import { Screen, ScreenActions, ScreenNote } from "../ui/Screen";
import { TextField } from "../ui/TextField";

/**
 * Enter a Jellyfin server URL and connect. Calls `onConnected` once the server is reachable;
 * `onBack` (when given) returns to the user picker.
 */
export function ConnectServerScreen({
  onConnected,
  onBack,
}: {
  onConnected: (server: ServerState) => void;
  onBack?: () => void;
}) {
  const container = useContainer();
  const vm = useMemo(() => createConnectToServerViewModel(container), [container]);
  const url = useRef("");

  useEffect(() => () => vm.dispose(), [vm]);

  const { state, error } = useStateful(vm);
  useStatefulEvents(vm, (event) => {
    if (event.kind === "connected" || event.kind === "duplicateServer") {
      onConnected(event.server);
    }
  });

  const connect = () => vm.send({ kind: "connect", url: url.current });

  return (
    <Screen title="Connect to Server">
      <ScreenNote>Enter the address of your Jellyfin server.</ScreenNote>
      <TextField
        placeholder="https://demo.jellyfin.org"
        keyboardType="url"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="go"
        autoFocus
        onChangeText={(text) => {
          url.current = text;
        }}
        onSubmit={connect}
      />
      <ScreenActions>
        <Button label="Connect" busy={state === "connecting"} onPress={connect} />
        {onBack ? <Button label="Back" variant="plain" onPress={onBack} /> : null}
      </ScreenActions>
      {error ? <ScreenNote error>{error.message}</ScreenNote> : null}
    </Screen>
  );
}
