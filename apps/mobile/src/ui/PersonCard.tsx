//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type Api, personImageSource } from "@anemone/core";
import type { BaseItemPerson } from "@jellyfin/sdk/lib/generated-client/models/base-item-person";
import type { ReactNode } from "react";
import { Image, StyleSheet, Text, View } from "react-native";
import {
  Focusable,
  focusGlow,
  focusLift,
  FocusRing,
  hoverTransition,
  useFocusIndicator,
} from "./Focusable";
import { imagePixelWidth } from "./imageSize";
import { space, theme } from "./theme";

const CARD_PHOTO_SIZE = 120;

function initials(name: string | null | undefined): string {
  return (name ?? "?")
    .split(/\s+/)
    .map((part) => part[0] ?? "")
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/**
 * A person's round photo, over their initials (shown when there's no photo, or while it loads).
 * `children` draw inside the clipped circle (the focus ring).
 */
export function PersonPhoto({
  api,
  person,
  size,
  focused = false,
  children,
}: {
  api: Api;
  person: BaseItemPerson;
  size: number;
  focused?: boolean;
  children?: ReactNode;
}) {
  const indicator = useFocusIndicator();
  const url = personImageSource(api, person, { maxWidth: imagePixelWidth(size) }).url;
  return (
    <View
      style={[
        styles.photo,
        { width: size, height: size },
        hoverTransition,
        focusGlow(indicator, focused),
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * INITIALS_SCALE }]}>
        {initials(person.Name)}
      </Text>
      {url ? <Image source={{ uri: url }} style={styles.image} resizeMode="cover" /> : null}
      {children}
    </View>
  );
}

/** Initials fill about a quarter of the photo's diameter at the `title` weight. */
const INITIALS_SCALE = 0.25;

/**
 * A person in a row (cast, people search): lifted photo with a ring following its circle and a
 * brightened name on focus, like posters. `subtitle` is their role, when known.
 */
export function PersonCard({
  api,
  person,
  subtitle,
  onPress,
}: {
  api: Api;
  person: BaseItemPerson;
  subtitle?: string | null;
  onPress: (person: BaseItemPerson) => void;
}) {
  const label = subtitle ? `${person.Name}, ${subtitle}` : (person.Name ?? "Person");

  return (
    <Focusable
      onPress={() => onPress(person)}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ focused }) => [styles.card, focused ? focusLift : null]}
    >
      {({ focused }) => (
        <>
          <PersonPhoto api={api} person={person} size={CARD_PHOTO_SIZE} focused={focused}>
            <FocusRing visible={focused} radius={theme.radii.pill} />
          </PersonPhoto>
          <Text numberOfLines={1} style={[styles.name, focused ? styles.nameFocused : null]}>
            {person.Name}
          </Text>
          {subtitle ? (
            <Text numberOfLines={1} style={[styles.role, focused ? styles.roleFocused : null]}>
              {subtitle}
            </Text>
          ) : null}
        </>
      )}
    </Focusable>
  );
}

/** Horizontal spacing between person cards in a row. */
export const PERSON_ROW_GAP = space(2.5);

const styles = StyleSheet.create({
  card: {
    width: CARD_PHOTO_SIZE,
    alignItems: "center",
  },
  photo: {
    borderRadius: theme.radii.pill,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: theme.colors.placeholder,
  },
  image: {
    ...StyleSheet.absoluteFill,
  },
  initials: {
    ...theme.type.title,
    color: theme.colors.muted,
  },
  name: {
    ...theme.type.caption,
    color: theme.colors.text,
    marginTop: space(1),
    textAlign: "center",
  },
  nameFocused: {
    fontWeight: theme.weight.semibold,
  },
  role: {
    ...theme.type.footnote,
    color: theme.colors.muted,
    marginTop: space(0.25),
    textAlign: "center",
  },
  roleFocused: {
    color: theme.colors.text,
  },
});
