//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { describeError, type ErrorKind, useCurrentSession } from "@anemone/core";
import { StyleSheet, Text, View } from "react-native";
import { Button } from "./Button";
import { Icon, type IconName } from "./Icon";
import { space, theme } from "./theme";

const KIND_ICONS: Record<ErrorKind, IconName> = {
  offline: "cloud-offline-outline",
  unauthorized: "lock-closed-outline",
  notFound: "search-outline",
  server: "warning-outline",
  unknown: "alert-circle-outline",
};

/** Retrying can't fix these; the message says what will. */
const NOT_RETRYABLE: ReadonlySet<ErrorKind> = new Set(["unauthorized", "notFound"]);

/**
 * A failed load, explained (`describeError`) with a Retry button where retrying can help — which
 * takes TV focus, so recovering is one press. Centred in whatever space it's given.
 */
export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  const { session } = useCurrentSession();
  const { kind, title, message } = describeError(error, session?.server.name);

  return (
    <View style={styles.container} accessibilityRole="alert">
      <Icon name={KIND_ICONS[kind]} size={ICON_SIZE} color={theme.colors.muted} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
      {onRetry && !NOT_RETRYABLE.has(kind) ? (
        // Wrapped so the button (which aligns itself to the start) centres here.
        <View>
          <Button label="Try Again" icon="refresh" variant="secondary" preferFocus onPress={onRetry} />
        </View>
      ) : null}
    </View>
  );
}

const ICON_SIZE = 40;
const MESSAGE_MAX_WIDTH = 420;

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    justifyContent: "center",
    gap: space(1.5),
    padding: space(4),
  },
  title: {
    ...theme.type.headline,
    color: theme.colors.text,
    textAlign: "center",
  },
  message: {
    ...theme.type.callout,
    color: theme.colors.muted,
    textAlign: "center",
    maxWidth: MESSAGE_MAX_WIDTH,
    marginBottom: space(1),
  },
});
