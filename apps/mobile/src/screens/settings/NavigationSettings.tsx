//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  useCanDockSearchField,
  useNavigationLabelsSetting,
  useNavigationPlacementSetting,
  useSearchFieldPlacementSetting,
} from "../../settings";
import { useIsCompact } from "../../ui/contentLayout";
import { ChoiceSetting, SettingsList, SettingsSection, ToggleSetting } from "../../ui/settings";
import { NAVIGATION_PLACEMENT_OPTIONS, SEARCH_FIELD_PLACEMENT_OPTIONS } from "./options";

/**
 * Where the section pill floats and whether a top/bottom pill labels its icons (wider screens —
 * phones always use the compact bottom pill), and on phones where Search's field sits.
 */
export function NavigationSettings() {
  const placement = useNavigationPlacementSetting();
  const labels = useNavigationLabelsSetting();
  const compact = useIsCompact();
  const horizontal = placement.value === "top" || placement.value === "bottom";
  const searchField = useSearchFieldPlacementSetting();
  const canDockSearchField = useCanDockSearchField();

  return (
    <SettingsList title="Navigation" back>
      {/* Phones always use the compact bottom pill, so its position and labels don't apply. */}
      {compact ? null : (
        <SettingsSection title="Section pill">
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
      )}

      {canDockSearchField ? (
        <SettingsSection title="Search">
          <ChoiceSetting
            label="Search field"
            description="Bottom keeps it within thumb reach, riding above the keyboard."
            options={SEARCH_FIELD_PLACEMENT_OPTIONS}
            value={searchField.value}
            onChange={searchField.setValue}
          />
        </SettingsSection>
      ) : null}
    </SettingsList>
  );
}
