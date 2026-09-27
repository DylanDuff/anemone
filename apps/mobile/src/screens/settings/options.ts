//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// The choices offered for each multiple-choice setting, shared by the page that edits a setting
// and the hub row that shows its current value.
//

import type {
  AccentColor,
  FocusIndicator,
  NavigationPlacement,
  SearchFieldPlacement,
} from "@anemone/core";
import type { SettingOption, SwatchOption } from "../../ui/settings";
import { theme } from "../../ui/theme";

export const NAVIGATION_PLACEMENT_OPTIONS: readonly SettingOption<NavigationPlacement>[] = [
  { value: "left", label: "Left" },
  { value: "right", label: "Right" },
  { value: "top", label: "Top" },
  { value: "bottom", label: "Bottom" },
];

export const FOCUS_INDICATOR_OPTIONS: readonly SettingOption<FocusIndicator>[] = [
  { value: "outline", label: "Outline" },
  { value: "glow", label: "Glow" },
];

export const SEARCH_FIELD_PLACEMENT_OPTIONS: readonly SettingOption<SearchFieldPlacement>[] = [
  { value: "bottom", label: "Bottom" },
  { value: "top", label: "Top" },
];

/** Each accent preset as an ink well, in its own colour. */
export const ACCENT_COLOR_OPTIONS: readonly SwatchOption<AccentColor>[] = (
  [
    ["violet", "Violet"],
    ["blue", "Blue"],
    ["teal", "Teal"],
    ["green", "Green"],
    ["yellow", "Yellow"],
    ["orange", "Orange"],
    ["red", "Red"],
    ["pink", "Pink"],
    ["white", "White"],
  ] as const
).map(([value, label]) => ({ value, label, color: theme.accents[value].color }));
