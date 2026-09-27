//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { playbackPositionTicks } from "@anemone/core";
import type { BaseItemDto } from "@jellyfin/sdk/lib/generated-client/models/base-item-dto";
import { type NavigatorScreenParams, useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useCallback } from "react";

/**
 * Top-level sections, shown beneath the section switcher (the navigation pill). Switching sections
 * swaps this nested stack's content without animation.
 */
export type BrowseParamList = {
  Home: undefined;
  Search: undefined;
  Library: { libraryID: string };
  Settings: undefined;
  /** A page opened from the Settings hub. */
  SettingsPage: { page: SettingsPageName };
};

/** The Settings hub's sub-pages. */
export type SettingsPageName = "navigation" | "appearance" | "about";

/**
 * Signed-in routes. `Browse` hosts the sections; item pages open full-screen over it. Params are
 * ids only so every screen is linkable — on web the URL survives a refresh and the browser back
 * button walks the stack.
 */
export type RootStackParamList = {
  Browse: NavigatorScreenParams<BrowseParamList> | undefined;
  Item: { itemID: string };
  /** `startTicks` resumes from a position; `mediaSourceID` picks a version. */
  Player: { itemID: string; startTicks?: number; mediaSourceID?: string };
};

export type AppNavigation = NativeStackNavigationProp<RootStackParamList>;

export function useAppNavigation(): AppNavigation {
  return useNavigation<AppNavigation>();
}

/** Anything with an item id: a full item, or a cast entry (a person is an item too). */
type ItemReference = Pick<BaseItemDto, "Id">;

/** A press handler that opens an item's detail page. Items without an id are ignored. */
export function useOpenItem(): (item: ItemReference) => void {
  const navigation = useAppNavigation();
  return useCallback(
    (item: ItemReference) => {
      if (item.Id) {
        navigation.push("Item", { itemID: item.Id });
      }
    },
    [navigation],
  );
}

/** A press handler that plays an item, resuming from its saved position if it has one. */
export function usePlayItem(): (item: BaseItemDto) => void {
  const navigation = useAppNavigation();
  return useCallback(
    (item: BaseItemDto) => {
      if (item.Id) {
        navigation.push("Player", {
          itemID: item.Id,
          startTicks: playbackPositionTicks(item) || undefined,
        });
      }
    },
    [navigation],
  );
}

/** A section to show in `Browse`: Home, Search, a library by id, or Settings. */
export type Section =
  | { kind: "home" }
  | { kind: "search" }
  | { kind: "library"; libraryID: string }
  | { kind: "settings" };

/**
 * Switch the `Browse` content to a section. Home pops back to the section root; a library replaces
 * whichever library is showing (the section stack is at most Home → one library), so Back from any
 * library returns Home.
 */
export function useOpenSection(): (section: Section) => void {
  const navigation = useAppNavigation();
  return useCallback(
    (section: Section) => {
      switch (section.kind) {
        case "home":
          navigation.navigate("Browse", { screen: "Home" });
          break;
        case "library":
          navigation.navigate("Browse", {
            screen: "Library",
            params: { libraryID: section.libraryID },
          });
          break;
        case "search":
          navigation.navigate("Browse", { screen: "Search" });
          break;
        case "settings":
          navigation.navigate("Browse", { screen: "Settings" });
          break;
      }
    },
    [navigation],
  );
}
