//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { BrowseParamList, SettingsPageName } from "../navigation/routes";
import { useCanDockSearchField, useNavigationPlacementSetting } from "../settings";
import { useIsCompact } from "../ui/contentLayout";
import { LinkSetting, optionLabel, SettingsList, SettingsSection } from "../ui/settings";
import { AdministrationSection } from "./admin";
import { AccountSection } from "./settings/AccountSection";
import { NAVIGATION_PLACEMENT_OPTIONS } from "./settings/options";

/**
 * The Settings hub (a top-level section): the account, then links to each page of device settings
 * (`SettingsPage`), then server administration for administrators. Device settings persist per
 * device and apply immediately.
 */
export function SettingsScreen({ navigation }: NativeStackScreenProps<BrowseParamList, "Settings">) {
  const placement = useNavigationPlacementSetting().value;
  // Phones always use the bottom pill, so the stored position would be misleading there.
  const compact = useIsCompact();
  const canDockSearchField = useCanDockSearchField();
  const openPage = (page: SettingsPageName) => navigation.push("SettingsPage", { page });

  return (
    <SettingsList title="Settings">
      <AccountSection />

      <SettingsSection title="Preferences">
        {/* A narrow web window has nothing to set here: the pill is fixed and Search can't dock. */}
        {compact && !canDockSearchField ? null : (
          <LinkSetting
            label="Navigation"
            icon={{ icon: "compass-outline", systemImage: "sidebar.left" }}
            detail={compact ? undefined : optionLabel(NAVIGATION_PLACEMENT_OPTIONS, placement)}
            onPress={() => openPage("navigation")}
          />
        )}
        <LinkSetting
          label="Appearance"
          icon={{ icon: "color-palette-outline", systemImage: "paintpalette" }}
          onPress={() => openPage("appearance")}
        />
      </SettingsSection>

      <AdministrationSection />

      <SettingsSection>
        <LinkSetting
          label="About"
          icon={{ icon: "information-circle-outline", systemImage: "info.circle" }}
          onPress={() => openPage("about")}
        />
      </SettingsSection>
    </SettingsList>
  );
}
