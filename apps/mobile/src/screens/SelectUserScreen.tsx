//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  createSelectUserViewModel,
  type SavedUser,
  savedUserImageURL,
  type ServerState,
  useContainer,
  useSessionController,
  useStateful,
  useStatefulEvents,
} from "@anemone/core";
import { type ReactNode, useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { Avatar } from "../ui/Avatar";
import { Button } from "../ui/Button";
import { useIsCompact } from "../ui/contentLayout";
import { Focusable, focusLift, FocusRing } from "../ui/Focusable";
import { Icon } from "../ui/Icon";
import { imagePixelWidth } from "../ui/imageSize";
import { Screen, ScreenNote } from "../ui/Screen";
import { space, theme } from "../ui/theme";

const AVATAR_SIZE = 110;
const COMPACT_AVATAR_SIZE = 88;

/**
 * "Who's watching?" (Swiftfin `SelectUserView`): every saved account as an avatar, one row per
 * server. Picking one signs straight in; Add User signs another account in to that server; Edit
 * removes accounts or whole servers. Calls `onEmpty` if nothing is saved, so the app can ask for a
 * server instead.
 */
export function SelectUserScreen({
  onAddUser,
  onAddServer,
  onEmpty,
}: {
  onAddUser: (server: ServerState) => void;
  onAddServer: () => void;
  onEmpty: () => void;
}) {
  const container = useContainer();
  const sessionController = useSessionController();
  const vm = useMemo(() => createSelectUserViewModel(container), [container]);
  const [editing, setEditing] = useState(false);
  const avatarSize = useIsCompact() ? COMPACT_AVATAR_SIZE : AVATAR_SIZE;

  useEffect(() => {
    vm.send({ kind: "getServers" });
    return () => vm.dispose();
  }, [vm]);

  const { state, error, data } = useStateful(vm);
  useStatefulEvents(vm, (event) => {
    if (event.kind === "signedIn") {
      // The view model made the user current; resolve their session.
      void sessionController.refresh();
    }
  });

  const loaded = state === "content";
  const empty = loaded && data.servers.length === 0;
  useEffect(() => {
    if (empty) {
      onEmpty();
    }
  }, [empty, onEmpty]);

  if (!loaded || empty) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={theme.colors.accent} />
      </View>
    );
  }

  return (
    <Screen
      title="Who's watching?"
      accessory={
        <Button
          label={editing ? "Done" : "Edit"}
          variant="plain"
          onPress={() => setEditing((value) => !value)}
        />
      }
    >
      {/* On TV, focus starts on the first tile. */}
      {data.servers.map(({ server, users }, serverIndex) => (
        <View key={server.id} style={styles.server}>
          <View style={styles.serverHeader}>
            <View style={styles.serverText}>
              <Text style={styles.serverName}>{server.name}</Text>
              <Text style={styles.serverURL}>{server.currentURL}</Text>
            </View>
            {editing ? (
              <Button
                label="Remove Server"
                variant="destructive"
                onPress={() => vm.send({ kind: "deleteServer", server })}
              />
            ) : null}
          </View>
          <View style={styles.tiles}>
            {users.map((user, userIndex) => (
              <UserTile
                key={user.id}
                user={user}
                serverURL={server.currentURL}
                size={avatarSize}
                editing={editing}
                preferFocus={serverIndex === 0 && userIndex === 0}
                onPress={() =>
                  editing
                    ? vm.send({ kind: "deleteUsers", users: [user] })
                    : vm.send({ kind: "signIn", user, pin: "" })
                }
              />
            ))}
            {editing ? null : (
              <AddTile
                label="Add User"
                size={avatarSize}
                preferFocus={serverIndex === 0 && users.length === 0}
                onPress={() => onAddUser(server)}
              />
            )}
          </View>
        </View>
      ))}

      {error ? <ScreenNote error>{error.message}</ScreenNote> : null}
      {editing ? null : (
        <Button label="Add Server" icon="add" variant="secondary" onPress={onAddServer} />
      )}
    </Screen>
  );
}

/** A saved account: avatar and name; in Edit mode, pressing removes it. */
function UserTile({
  user,
  serverURL,
  size,
  editing,
  preferFocus,
  onPress,
}: {
  user: SavedUser;
  serverURL: string;
  size: number;
  editing: boolean;
  preferFocus: boolean;
  onPress: () => void;
}) {
  const imageURL = savedUserImageURL(serverURL, user.id, user.imageTag, {
    maxWidth: imagePixelWidth(size),
  });
  return (
    <Tile
      label={user.username}
      accessibilityLabel={editing ? `Remove ${user.username}` : user.username}
      size={size}
      preferFocus={preferFocus}
      onPress={onPress}
    >
      {(focused) => (
        <View>
          <Avatar name={user.username} imageURL={imageURL} size={size} focused={focused}>
            <FocusRing visible={focused} radius={theme.radii.pill} />
          </Avatar>
          {editing ? (
            <View style={styles.removeBadge}>
              <Icon name="remove-circle" size={REMOVE_BADGE_SIZE} color={theme.colors.error} />
            </View>
          ) : null}
        </View>
      )}
    </Tile>
  );
}

/** A dashed circle with a plus: sign another account in to a server. */
function AddTile({
  label,
  size,
  preferFocus,
  onPress,
}: {
  label: string;
  size: number;
  preferFocus: boolean;
  onPress: () => void;
}) {
  return (
    <Tile label={label} accessibilityLabel={label} size={size} preferFocus={preferFocus} onPress={onPress}>
      {(focused) => (
        <View
          style={[
            styles.addCircle,
            { width: size, height: size },
            focused ? styles.addCircleFocused : null,
          ]}
        >
          <Icon
            name="add"
            size={size * ADD_ICON_SCALE}
            color={focused ? theme.colors.chipActiveText : theme.colors.muted}
          />
        </View>
      )}
    </Tile>
  );
}

/** One picker tile: artwork (given `focused`) over a label, lifted on focus like posters. */
function Tile({
  label,
  accessibilityLabel,
  size,
  preferFocus,
  onPress,
  children,
}: {
  label: string;
  accessibilityLabel: string;
  size: number;
  preferFocus: boolean;
  onPress: () => void;
  children: (focused: boolean) => ReactNode;
}) {
  return (
    <Focusable
      onPress={onPress}
      hasTVPreferredFocus={preferFocus}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      style={({ focused }) => [styles.tile, { width: size }, focused ? focusLift : null]}
    >
      {({ focused }) => (
        <>
          {children(focused)}
          <Text numberOfLines={1} style={[styles.tileLabel, focused ? styles.tileLabelFocused : null]}>
            {label}
          </Text>
        </>
      )}
    </Focusable>
  );
}

const REMOVE_BADGE_SIZE = 28;
/** The plus fills about a third of the add circle. */
const ADD_ICON_SCALE = 0.35;

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.background,
  },
  server: {
    gap: space(2),
    marginBottom: space(2),
  },
  serverHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space(2),
  },
  serverText: {
    flexShrink: 1,
    gap: space(0.25),
  },
  serverName: {
    ...theme.type.heading,
    color: theme.colors.text,
  },
  serverURL: {
    ...theme.type.caption,
    color: theme.colors.muted,
  },
  tiles: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space(3),
  },
  tile: {
    alignItems: "center",
    gap: space(1),
  },
  tileLabel: {
    ...theme.type.callout,
    color: theme.colors.muted,
    textAlign: "center",
  },
  tileLabelFocused: {
    color: theme.colors.text,
    fontWeight: theme.weight.semibold,
  },
  removeBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    borderRadius: theme.radii.pill,
    backgroundColor: theme.colors.background,
  },
  addCircle: {
    alignItems: "center",
    justifyContent: "center",
    borderRadius: theme.radii.pill,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: theme.colors.border,
  },
  addCircleFocused: {
    borderStyle: "solid",
    borderColor: theme.colors.chipActive,
    backgroundColor: theme.colors.chipActive,
  },
});
