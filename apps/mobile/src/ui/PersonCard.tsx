//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type Api, personImageSource } from "@anemone/core";
import type { BaseItemPerson } from "@jellyfin/sdk/lib/generated-client/models/base-item-person";
import type { ReactNode } from "react";
import { StyleSheet, Text } from "react-native";
import { Avatar } from "./Avatar";
import { Focusable, focusLift, FocusRing } from "./Focusable";
import { imagePixelWidth } from "./imageSize";
import { space, theme } from "./theme";

const CARD_PHOTO_SIZE = 120;

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
  const url = personImageSource(api, person, { maxWidth: imagePixelWidth(size) }).url;
  return (
    <Avatar name={person.Name} imageURL={url} size={size} focused={focused}>
      {children}
    </Avatar>
  );
}

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
