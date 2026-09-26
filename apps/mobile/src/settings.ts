//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// Device settings shown on the Settings screen, with this platform's defaults. Persistence lives in
// core (`AppSettingsKeys`); components read them through the hooks here so the defaults stay in one
// place.
//

import {
  AppSettingsKeys,
  type FocusIndicator,
  type StoredValueBinding,
  useStoredValue,
} from "@anemone/core";
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
