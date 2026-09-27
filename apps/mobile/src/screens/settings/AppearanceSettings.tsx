//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import {
  useAccentColorSetting,
  useFocusIndicatorSetting,
  useGlassBlurSetting,
  useGlassButtonsSetting,
  useHeroGlowSetting,
} from "../../settings";
import { useIsPhone } from "../../ui/contentLayout";
import {
  ChoiceSetting,
  SettingsList,
  SettingsSection,
  SwatchSetting,
  ToggleSetting,
} from "../../ui/settings";
import { ACCENT_COLOR_OPTIONS, FOCUS_INDICATOR_OPTIONS } from "./options";

/**
 * The accent colour, how focus is drawn (not on touch-only phones), and heavy effects a slow
 * device may want off.
 */
export function AppearanceSettings() {
  const accentColor = useAccentColorSetting();
  const focusIndicator = useFocusIndicatorSetting();
  // Phones are touch-only: nothing is ever focused or hovered, so the highlight never shows.
  const isPhone = useIsPhone();
  const heroGlow = useHeroGlowSetting();
  const glassBlur = useGlassBlurSetting();
  const glassButtons = useGlassButtonsSetting();

  return (
    <SettingsList title="Appearance" back>
      <SettingsSection title="Colour">
        <SwatchSetting
          label="Accent colour"
          description="Used for selections, active sections, switches and progress."
          options={ACCENT_COLOR_OPTIONS}
          value={accentColor.value}
          onChange={accentColor.setValue}
        />
      </SettingsSection>

      {isPhone ? null : (
        <SettingsSection title="Focus">
          <ChoiceSetting
            label="Focus highlight"
            description="How the highlighted poster, card or photo is marked."
            options={FOCUS_INDICATOR_OPTIONS}
            value={focusIndicator.value}
            onChange={focusIndicator.setValue}
          />
        </SettingsSection>
      )}

      <SettingsSection
        title="Visual effects"
        footer="These are the most demanding effects to draw. Turn them off if browsing stutters on this device."
      >
        <ToggleSetting
          label="Hero glow"
          description="A blurred glow of the featured artwork that spills into the rows below."
          value={heroGlow.value}
          onChange={heroGlow.setValue}
        />
        <ToggleSetting
          label="Glass blur"
          description="Live blur behind the navigation pill. Off shows a solid translucent pill."
          value={glassBlur.value}
          onChange={glassBlur.setValue}
        />
        {glassBlur.value ? (
          <ToggleSetting
            label="Glass buttons"
            description="Also blur behind the translucent buttons and chips: over artwork (Play, played, favourite, info; year, rating, quality) and the library toolbar."
            value={glassButtons.value}
            onChange={glassButtons.setValue}
          />
        ) : null}
      </SettingsSection>
    </SettingsList>
  );
}
