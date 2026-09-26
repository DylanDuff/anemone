//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  createUserSignInViewModel,
  type ServerState,
  useContainer,
  useSessionController,
  useStateful,
  useStatefulEvents,
} from "@anemone/core";
import { useEffect, useMemo, useRef } from "react";
import { Button } from "../ui/Button";
import { Screen, ScreenActions, ScreenNote } from "../ui/Screen";
import { TextField } from "../ui/TextField";

/**
 * Sign in to `server` with a username/password. On success the user is saved with the `none` access
 * policy and made current, which flips the app to the library (PIN/biometric policies come later).
 */
export function SignInScreen({ server, onBack }: { server: ServerState; onBack: () => void }) {
  const container = useContainer();
  const sessionController = useSessionController();
  const vm = useMemo(() => createUserSignInViewModel(container, server), [container, server]);
  const username = useRef("");
  const password = useRef("");

  useEffect(() => {
    vm.send({ kind: "getPublicData" });
    return () => vm.dispose();
  }, [vm]);

  const { state, error, data } = useStateful(vm);
  useStatefulEvents(vm, (event) => {
    if (event.kind === "connected" || event.kind === "existingUser") {
      // No PIN/biometric UI yet — save with the "none" policy and proceed.
      vm.send({ kind: "save", request: { auth: event.auth, access: { policy: "none" } } });
    } else if (event.kind === "saved") {
      void sessionController.setCurrentUser(event.user.id);
    }
  });

  const signIn = () =>
    vm.send({ kind: "signIn", username: username.current, password: password.current });

  return (
    <Screen title={`Sign in to ${server.name}`}>
      {data.serverDisclaimer ? <ScreenNote>{data.serverDisclaimer}</ScreenNote> : null}
      <TextField
        placeholder="Username"
        autoCapitalize="none"
        autoCorrect={false}
        returnKeyType="next"
        autoFocus
        onChangeText={(text) => {
          username.current = text;
        }}
      />
      <TextField
        placeholder="Password"
        secureTextEntry
        returnKeyType="go"
        onChangeText={(text) => {
          password.current = text;
        }}
        onSubmit={signIn}
      />
      <ScreenActions>
        <Button label="Sign In" busy={state === "signingIn"} onPress={signIn} />
        <Button label="Back" variant="plain" onPress={onBack} />
      </ScreenActions>
      {error ? <ScreenNote error>{error.message}</ScreenNote> : null}
    </Screen>
  );
}
