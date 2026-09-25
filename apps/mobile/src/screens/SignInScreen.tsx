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
import { Button, Text, TextInput } from "@expo/ui";
import { useEffect, useMemo, useRef } from "react";
import { Screen } from "../ui/Screen";

/**
 * Sign in to `server` with a username/password. On success the user is saved with the `none` access
 * policy and made current, which flips the app to the library (PIN/biometric policies come later).
 */
export function SignInScreen({
    server,
    onBack,
}: {
    server: ServerState;
    onBack: () => void;
}) {
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

    const signingIn = state === "signingIn";

    return (
        <Screen title={`Sign in to ${server.name}`}>
            {data.serverDisclaimer ? (
                <Text textStyle={{ color: "#555" }}>{data.serverDisclaimer}</Text>
            ) : null}
            <TextInput
                placeholder="Username"
                autoFocus
                onChangeText={(text) => {
                    username.current = text;
                }}
            />
            <TextInput
                placeholder="Password"
                secureTextEntry
                onChangeText={(text) => {
                    password.current = text;
                }}
            />
            <Button
                label={signingIn ? "Signing in…" : "Sign In"}
                onPress={() =>
                    vm.send({
                        kind: "signIn",
                        username: username.current,
                        password: password.current,
                    })
                }
            />
            <Button label="Back" variant="text" onPress={onBack} />
            {error ? <Text textStyle={{ color: "#c0392b" }}>{error.message}</Text> : null}
        </Screen>
    );
}
