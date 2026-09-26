//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { displayTitle, useUserViews } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { CollectionType } from "@jellyfin/sdk/lib/generated-client/models/collection-type";
import type { Section } from "./routes";

/** One destination in the section switcher (rail on wide screens, tab bar on phones). */
export interface SectionEntry {
  readonly key: string;
  readonly label: string;
  /** Filled Ionicons name; render with `iconVariant(icon, active)` (outline when inactive). */
  readonly icon: string;
  readonly section: Section;
  readonly active: boolean;
  /** Utility entries (Settings) sit apart from the content sections, at the end. */
  readonly separated?: boolean;
}

const LIBRARY_ICONS: Partial<Record<string, string>> = {
  [CollectionType.Movies]: "film",
  [CollectionType.Tvshows]: "tv",
  [CollectionType.Music]: "musical-notes",
  [CollectionType.Musicvideos]: "musical-notes",
  [CollectionType.Boxsets]: "albums",
  [CollectionType.Books]: "book",
  [CollectionType.Homevideos]: "images",
  [CollectionType.Photos]: "images",
  [CollectionType.Playlists]: "list",
  [CollectionType.Livetv]: "radio",
};

function libraryIcon(library: BaseItemDto): string {
  return (library.CollectionType && LIBRARY_ICONS[library.CollectionType]) ?? "folder";
}

function isSameSection(a: Section, b: Section): boolean {
  if (a.kind === "library") {
    return b.kind === "library" && a.libraryID === b.libraryID;
  }
  return a.kind === b.kind;
}

/** Home, every library the server returns, then Settings — marking the one currently shown. */
export function useSectionEntries(active: Section): SectionEntry[] {
  const { data: views } = useUserViews();
  const home: Section = { kind: "home" };
  const libraries = (views ?? []).flatMap((view): SectionEntry[] => {
    if (!view.Id) {
      return [];
    }
    const section: Section = { kind: "library", libraryID: view.Id };
    return [
      {
        key: view.Id,
        label: displayTitle(view),
        icon: libraryIcon(view),
        section,
        active: isSameSection(section, active),
      },
    ];
  });

  const settings: Section = { kind: "settings" };
  return [
    { key: "home", label: "Home", icon: "home", section: home, active: isSameSection(home, active) },
    ...libraries,
    {
      key: "settings",
      label: "Settings",
      icon: "settings",
      section: settings,
      active: isSameSection(settings, active),
      separated: true,
    },
  ];
}
