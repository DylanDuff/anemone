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
import { Button, Text, TextInput } from "@expo/ui";
import { useEffect, useMemo, useRef } from "react";
import { Screen } from "../ui/Screen";

/** Enter a Jellyfin server URL and connect. Calls `onConnected` once the server is reachable. */
export function ConnectServerScreen({ onConnected }: { onConnected: (server: ServerState) => void }) {
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

    const connecting = state === "connecting";

    return (
        <Screen title="Connect to Server">
            <Text textStyle={{ color: "#555" }}>Enter the address of your Jellyfin server.</Text>
            <TextInput
                placeholder="https://demo.jellyfin.org"
                keyboardType="url"
                autoFocus
                onChangeText={(text) => {
                    url.current = text;
                }}
            />
            <Button
                label={connecting ? "Connecting…" : "Connect"}
                onPress={() => vm.send({ kind: "connect", url: url.current })}
            />
            {error ? <Text textStyle={{ color: "#c0392b" }}>{error.message}</Text> : null}
        </Screen>
    );
}
