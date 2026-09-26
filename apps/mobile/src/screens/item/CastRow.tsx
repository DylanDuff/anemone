//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type Api, personImageSource } from "@anemone/core";
import type { BaseItemPerson } from "@jellyfin/sdk/lib/generated-client/models/base-item-person";
import { PersonKind } from "@jellyfin/sdk/lib/generated-client/models/person-kind";
import { Image, StyleSheet, Text, View } from "react-native";
import {
  Focusable,
  focusGlow,
  focusLift,
  FocusRing,
  hoverTransition,
  useFocusIndicator,
} from "../../ui/Focusable";
import { Shelf } from "../../ui/Shelf";
import { space, theme } from "../../ui/theme";
import { imagePixelWidth } from "../../ui/imageSize";

const PHOTO_SIZE = 120;
const CAST_KINDS: readonly string[] = [PersonKind.Actor, PersonKind.GuestStar];

/** Actors and guest stars (Swiftfin `CastAndCrewHStack`); crew is listed under About. */
export function CastRow({ api, people }: { api: Api; people: readonly BaseItemPerson[] }) {
  const cast = people.filter((person) => person.Type && CAST_KINDS.includes(person.Type));
  if (cast.length === 0) {
    return null;
  }

  return (
    <Shelf title="Cast" gap={space(2.5)}>
      {cast.map((person, index) => (
        <PersonCard key={`${person.Id ?? person.Name}-${index}`} api={api} person={person} />
      ))}
    </Shelf>
  );
}

function initials(name: string | null | undefined): string {
  return (name ?? "?")
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * One cast member. Focusable so the D-pad can walk (and scroll) the row, with the same focus
 * treatment as posters: lifted photo with a ring following its circle, brightened name. Pressing
 * does nothing yet — a person page (library filtered by person) is in docs/BACKLOG.md.
 */
function PersonCard({ api, person }: { api: Api; person: BaseItemPerson }) {
  const indicator = useFocusIndicator();
  const url = personImageSource(api, person, { maxWidth: imagePixelWidth(PHOTO_SIZE) }).url;
  const label = person.Role ? `${person.Name}, ${person.Role}` : (person.Name ?? "Cast member");

  return (
    <Focusable
      onPress={() => undefined}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ focused }) => [styles.card, focused ? focusLift : null]}
    >
      {({ focused }) => (
        <>
          <View style={[styles.photo, hoverTransition, focusGlow(indicator, focused)]}>
            <Text style={styles.initials}>{initials(person.Name)}</Text>
            {url ? <Image source={{ uri: url }} style={styles.image} resizeMode="cover" /> : null}
            <FocusRing visible={focused} radius={PHOTO_SIZE / 2} />
          </View>
          <Text numberOfLines={1} style={[styles.name, focused ? styles.nameFocused : null]}>
            {person.Name}
          </Text>
          {person.Role ? (
            <Text numberOfLines={1} style={[styles.role, focused ? styles.roleFocused : null]}>
              {person.Role}
            </Text>
          ) : null}
        </>
      )}
    </Focusable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: PHOTO_SIZE,
    alignItems: "center",
  },
  photo: {
    width: PHOTO_SIZE,
    height: PHOTO_SIZE,
    borderRadius: PHOTO_SIZE / 2,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.placeholder,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  initials: {
    color: theme.colors.muted,
    fontSize: 28,
    fontWeight: "600",
  },
  name: {
    color: theme.colors.text,
    fontSize: 13,
    marginTop: space(1),
    textAlign: "center",
  },
  nameFocused: {
    fontWeight: "600",
  },
  roleFocused: {
    color: theme.colors.text,
  },
  role: {
    color: theme.colors.muted,
    fontSize: 12,
    marginTop: space(0.25),
    textAlign: "center",
  },
});
