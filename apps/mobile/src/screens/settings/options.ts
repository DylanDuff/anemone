//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// The choices offered for each multiple-choice setting, shared by the page that edits a setting
// and the hub row that shows its current value.
//

import type { FocusIndicator, NavigationPlacement } from "@anemone/core";
import type { SettingOption } from "../../ui/settings";

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
