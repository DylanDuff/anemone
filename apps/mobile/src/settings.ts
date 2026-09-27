//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// Device settings shown on the Settings screen, with this platform's defaults. Persistence lives in
// core (`AppSettingsKeys`); components read them through the hooks here so the defaults stay in one
// place.
//

import {
  type AccentColor,
  AppSettingsKeys,
  type FocusIndicator,
  type NavigationPlacement,
  type SearchFieldPlacement,
  type StoredValueBinding,
  useStoredValue,
} from "@anemone/core";
import { useIsPhone } from "./ui/contentLayout";
import { type AccentPalette, theme } from "./ui/theme";
import { isTV } from "./ui/tv";

export const Settings = {
  /** The hero glow is part of the design, so it's on everywhere by default. */
  heroGlow: AppSettingsKeys.heroGlow(true),
  /** Live blur is measurably heavy on Android TV hardware; off there by default, on elsewhere. */
  glassBlur: AppSettingsKeys.glassBlur(!isTV),
  /** Glass on the translucent buttons and detail chips too — opt-in: each is another live blur. */
  glassButtons: AppSettingsKeys.glassButtons(false),
  /** A crisp outline reads best from a sofa; a soft glow suits pointer/touch screens. */
  focusIndicator: AppSettingsKeys.focusIndicator(isTV ? "outline" : "glow"),
  /** The pill has always floated on the left; phones ignore this and use the bottom. */
  navigationPlacement: AppSettingsKeys.navigationPlacement("left"),
  /** Top/bottom pills label their icons by default; phones' compact pill never does. */
  navigationLabels: AppSettingsKeys.navigationLabels(true),
  /** The app's accent; violet has always been Anemone's. */
  accentColor: AppSettingsKeys.accentColor("violet"),
  /** Phones dock Search's field at the bottom, in thumb reach above the keyboard. */
  searchFieldPlacement: AppSettingsKeys.searchFieldPlacement("bottom"),
} as const;

export function useHeroGlowSetting(): StoredValueBinding<boolean> {
  return useStoredValue(Settings.heroGlow);
}

export function useGlassBlurSetting(): StoredValueBinding<boolean> {
  return useStoredValue(Settings.glassBlur);
}

export function useGlassButtonsSetting(): StoredValueBinding<boolean> {
  return useStoredValue(Settings.glassButtons);
}

/** Whether action buttons should render glass: the sub-setting only applies while blur is on. */
export function useGlassButtons(): boolean {
  const blur = useGlassBlurSetting();
  const buttons = useGlassButtonsSetting();
  return blur.value && buttons.value;
}

export function useFocusIndicatorSetting(): StoredValueBinding<FocusIndicator> {
  return useStoredValue(Settings.focusIndicator);
}

export function useNavigationPlacementSetting(): StoredValueBinding<NavigationPlacement> {
  return useStoredValue(Settings.navigationPlacement);
}

export function useNavigationLabelsSetting(): StoredValueBinding<boolean> {
  return useStoredValue(Settings.navigationLabels);
}

export function useSearchFieldPlacementSetting(): StoredValueBinding<SearchFieldPlacement> {
  return useStoredValue(Settings.searchFieldPlacement);
}

/** Whether Search's field can dock at the bottom here: phones only (not web, tablets or TV). */
export function useCanDockSearchField(): boolean {
  return useIsPhone();
}

/** Whether Search's field is docked at the bottom (a phone, with the setting on Bottom). */
export function useSearchFieldDocked(): boolean {
  const canDock = useCanDockSearchField();
  const placement = useSearchFieldPlacementSetting().value;
  return canDock && placement === "bottom";
}

export function useAccentColorSetting(): StoredValueBinding<AccentColor> {
  return useStoredValue(Settings.accentColor);
}

/**
 * The accent in use — its colour and the colour that reads on it. Components read the accent only
 * through this (never a static style), so changing the setting recolours the app at once.
 */
export function useAccent(): AccentPalette {
  return theme.accents[useAccentColorSetting().value];
}
