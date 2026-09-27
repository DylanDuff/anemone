//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { useNavigationLabelsSetting, useNavigationPlacementSetting } from "../../settings";
import { useIsCompact } from "../../ui/contentLayout";
import { ChoiceSetting, SettingsList, SettingsSection, ToggleSetting } from "../../ui/settings";
import { NAVIGATION_PLACEMENT_OPTIONS } from "./options";

/** Where the section pill floats, and whether a top/bottom pill labels its icons. */
export function NavigationSettings() {
  const placement = useNavigationPlacementSetting();
  const labels = useNavigationLabelsSetting();
  const compact = useIsCompact();
  const horizontal = placement.value === "top" || placement.value === "bottom";

  return (
    <SettingsList title="Navigation" back>
      <SettingsSection
        footer={
          compact
            ? "Phones always show a compact pill along the bottom; these apply on larger screens."
            : undefined
        }
      >
        <ChoiceSetting
          label="Position"
          description="Which edge of the screen the section pill floats along."
          options={NAVIGATION_PLACEMENT_OPTIONS}
          value={placement.value}
          onChange={placement.setValue}
        />
        {horizontal ? (
          <ToggleSetting
            label="Show labels"
            description="Section names under the icons. Off keeps the pill icon-only and slimmer."
            value={labels.value}
            onChange={labels.setValue}
          />
        ) : null}
      </SettingsSection>
    </SettingsList>
  );
}
