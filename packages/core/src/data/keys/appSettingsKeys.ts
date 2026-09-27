//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

import { APP_OWNER_ID, storedKey, type StoredValueKey } from "../storedValues";

/** How focused/hovered artwork is marked: a white outline ring, or a soft white glow around it. */
export type FocusIndicator = "outline" | "glow";

export const focusIndicatorValues: readonly FocusIndicator[] = ["outline", "glow"];

/** Which window edge the section switcher (navigation pill) floats along on wide screens. */
export type NavigationPlacement = "left" | "right" | "top" | "bottom";

export const navigationPlacementValues: readonly NavigationPlacement[] = ["left", "right", "top", "bottom"];

/** Where Search's field sits on phones: docked at the bottom (above the keyboard) or in the header. */
export type SearchFieldPlacement = "top" | "bottom";

export const searchFieldPlacementValues: readonly SearchFieldPlacement[] = ["top", "bottom"];

/** The app's accent colour, from a fixed set of presets (the app maps each to its colour). */
export type AccentColor =
    | "violet"
    | "blue"
    | "teal"
    | "green"
    | "yellow"
    | "orange"
    | "red"
    | "pink"
    | "white";

export const accentColorValues: readonly AccentColor[] = [
    "violet",
    "blue",
    "teal",
    "green",
    "yellow",
    "orange",
    "red",
    "pink",
    "white",
];

/**
 * Device-wide app settings from the Settings screen, kept in the key/value store (not SQL): they
 * describe what *this device* should render — e.g. heavy visual effects a weak TV can't afford —
 * so they're per device, not per user or server.
 *
 * Each key takes its default from the caller, because the right default is platform-dependent
 * (the app decides; core stays platform-agnostic). Read and write them with `StoredValues` /
 * `useStoredValue`.
 */
export const AppSettingsKeys = {
    /** The blurred, colour-matched glow behind the home hero. */
    heroGlow: (defaultValue: boolean): StoredValueKey<boolean> =>
        storedKey<boolean>({
            field: "settings.heroGlow",
            ownerID: APP_OWNER_ID,
            storage: "defaults",
            default: defaultValue,
        }),

    /** Live blur behind glass surfaces (the section rail); off shows a translucent tint instead. */
    glassBlur: (defaultValue: boolean): StoredValueKey<boolean> =>
        storedKey<boolean>({
            field: "settings.glassBlur",
            ownerID: APP_OWNER_ID,
            storage: "defaults",
            default: defaultValue,
        }),

    /**
     * Glass (blur) behind the translucent buttons and detail chips over artwork. Only meaningful while
     * `glassBlur` is on; the Settings screen shows it as a sub-setting of that.
     */
    glassButtons: (defaultValue: boolean): StoredValueKey<boolean> =>
        storedKey<boolean>({
            field: "settings.glassButtons",
            ownerID: APP_OWNER_ID,
            storage: "defaults",
            default: defaultValue,
        }),

    /** The focus/hover indicator on artwork and cards. */
    focusIndicator: (defaultValue: FocusIndicator): StoredValueKey<FocusIndicator> =>
        storedKey<FocusIndicator>({
            field: "settings.focusIndicator",
            ownerID: APP_OWNER_ID,
            storage: "defaults",
            default: defaultValue,
        }),

    /** Where the navigation pill sits on wide screens (phones always put it at the bottom). */
    navigationPlacement: (defaultValue: NavigationPlacement): StoredValueKey<NavigationPlacement> =>
        storedKey<NavigationPlacement>({
            field: "settings.navigationPlacement",
            ownerID: APP_OWNER_ID,
            storage: "defaults",
            default: defaultValue,
        }),

    /** Labels under the icons when the navigation pill runs along the top or bottom. */
    navigationLabels: (defaultValue: boolean): StoredValueKey<boolean> =>
        storedKey<boolean>({
            field: "settings.navigationLabels",
            ownerID: APP_OWNER_ID,
            storage: "defaults",
            default: defaultValue,
        }),

    /** The accent colour preset: selections, active states, switches, spinners. */
    accentColor: (defaultValue: AccentColor): StoredValueKey<AccentColor> =>
        storedKey<AccentColor>({
            field: "settings.accentColor",
            ownerID: APP_OWNER_ID,
            storage: "defaults",
            default: defaultValue,
        }),

    /** Where Search's field sits on phones (wider screens always keep it in the header). */
    searchFieldPlacement: (defaultValue: SearchFieldPlacement): StoredValueKey<SearchFieldPlacement> =>
        storedKey<SearchFieldPlacement>({
            field: "settings.searchFieldPlacement",
            ownerID: APP_OWNER_ID,
            storage: "defaults",
            default: defaultValue,
        }),
} as const;
