//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// Settings pages are built from these components. With `nativeControls` they're the platform's own
// grouped list (SwiftUI `Form` on iOS/iPadOS/tvOS, Material rows on Android phones); on web and
// Android TV they're our themed rows. Screens never branch on it.
//

import { nativeControls } from "../nativeControls";
import * as NativeSettings from "./NativeSettings";
import * as ThemedSettings from "./ThemedSettings";
import type { SettingsKit } from "./types";

const kit: SettingsKit = nativeControls ? NativeSettings : ThemedSettings;

export const {
  SettingsList,
  SettingsSection,
  ToggleSetting,
  ChoiceSetting,
  LinkSetting,
  InfoSetting,
  ActionSetting,
  TextSetting,
} = kit;

export { optionLabel, type SettingIcon, type SettingOption } from "./types";
