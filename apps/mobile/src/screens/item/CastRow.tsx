//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { Api } from "@anemone/core";
import type { BaseItemPerson } from "@jellyfin/sdk/lib/generated-client/models/base-item-person";
import { PersonKind } from "@jellyfin/sdk/lib/generated-client/models/person-kind";
import { useOpenItem } from "../../navigation/routes";
import { PERSON_ROW_GAP, PersonCard } from "../../ui/PersonCard";
import { Shelf } from "../../ui/Shelf";

const CAST_KINDS: readonly string[] = [PersonKind.Actor, PersonKind.GuestStar];

/**
 * Actors and guest stars (Swiftfin `CastAndCrewHStack`); crew is listed under About. Each opens
 * the person's page.
 */
export function CastRow({ api, people }: { api: Api; people: readonly BaseItemPerson[] }) {
  const openItem = useOpenItem();
  const cast = people.filter((person) => person.Type && CAST_KINDS.includes(person.Type));
  if (cast.length === 0) {
    return null;
  }

  return (
    <Shelf title="Cast" gap={PERSON_ROW_GAP}>
      {cast.map((person, index) => (
        <PersonCard
          key={`${person.Id ?? person.Name}-${index}`}
          api={api}
          person={person}
          subtitle={person.Role}
          onPress={openItem}
        />
      ))}
    </Shelf>
  );
}
