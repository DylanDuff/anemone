//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import type { BrowseParamList, SettingsPageName } from "../../navigation/routes";
import { AboutSettings } from "./AboutSettings";
import { AppearanceSettings } from "./AppearanceSettings";
import { NavigationSettings } from "./NavigationSettings";

const PAGES: Partial<Record<string, () => React.ReactElement>> = {
  navigation: NavigationSettings,
  appearance: AppearanceSettings,
  about: AboutSettings,
} satisfies Record<SettingsPageName, () => React.ReactElement>;

/** A Settings sub-page, by name — an unknown name (e.g. a stale web URL) returns to the hub. */
export function SettingsPageScreen({
  navigation,
  route,
}: NativeStackScreenProps<BrowseParamList, "SettingsPage">) {
  const Page = PAGES[route.params.page];
  useEffect(() => {
    if (!Page) {
      navigation.replace("Settings");
    }
  }, [Page, navigation]);
  return Page ? <Page /> : null;
}
