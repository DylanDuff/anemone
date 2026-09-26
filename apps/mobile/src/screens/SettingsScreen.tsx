//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useEffect } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import type { BrowseParamList } from "../navigation/routes";
import {
  useFocusIndicatorSetting,
  useGlassBlurSetting,
  useGlassButtonsSetting,
  useHeroGlowSetting,
  useNavigationLabelsSetting,
  useNavigationPlacementSetting,
} from "../settings";
import { ChoiceRow } from "../ui/ChoiceRow";
import { showsPageScrollIndicator, useContentLayout, useIsCompact } from "../ui/contentLayout";
import { usePageScrollHandler } from "../ui/pageScroll";
import { space, theme } from "../ui/theme";
import { ToggleRow } from "../ui/ToggleRow";
import { AccountSection } from "./settings/AccountSection";

/**
 * Device settings (a top-level section). Values persist per device and apply immediately — every
 * reader of a setting updates as soon as it's toggled.
 */
export function SettingsScreen({ navigation }: NativeStackScreenProps<BrowseParamList, "Settings">) {
  const { insetLeft, insetRight, insetTop, insetBottom } = useContentLayout();
  const heroGlow = useHeroGlowSetting();
  const glassBlur = useGlassBlurSetting();
  const glassButtons = useGlassButtonsSetting();
  const focusIndicator = useFocusIndicatorSetting();
  const navigationPlacement = useNavigationPlacementSetting();
  const navigationLabels = useNavigationLabelsSetting();
  const compact = useIsCompact();
  const onPageScroll = usePageScrollHandler();

  useEffect(() => {
    navigation.setOptions({ title: "Settings" });
  }, [navigation]);

  return (
    <ScrollView
      showsVerticalScrollIndicator={showsPageScrollIndicator}
      onScroll={onPageScroll}
      scrollEventThrottle={16}
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingLeft: insetLeft,
          paddingRight: insetRight,
          paddingTop: CONTENT_PADDING_TOP + insetTop,
          paddingBottom: CONTENT_PADDING_BOTTOM + insetBottom,
        },
      ]}
    >
      <Text style={styles.title}>Settings</Text>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Account</Text>
        <AccountSection />
      </View>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Visual effects</Text>
        <Text style={styles.groupNote}>
          These are the most demanding effects to draw. Turn them off if browsing stutters on this
          device.
        </Text>
        <ToggleRow
          label="Hero glow"
          description="A blurred glow of the featured artwork that spills into the rows below."
          value={heroGlow.value}
          onChange={heroGlow.setValue}
        />
        <ToggleRow
          label="Glass blur"
          description="Live blur behind the navigation pill. Off shows a solid translucent pill."
          value={glassBlur.value}
          onChange={glassBlur.setValue}
        />
        {glassBlur.value ? (
          <ToggleRow
            nested
            label="Glass buttons"
            description="Also blur behind the translucent buttons and chips: over artwork (Play, played, favourite, info; year, rating, quality) and the library toolbar."
            value={glassButtons.value}
            onChange={glassButtons.setValue}
          />
        ) : null}
      </View>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Navigation</Text>
        <ChoiceRow
          label="Navigation position"
          description={
            compact
              ? "Where the section pill sits on larger screens. Phones always show it along the bottom."
              : "Which edge of the screen the section pill floats along."
          }
          options={[
            { value: "left", label: "Left" },
            { value: "right", label: "Right" },
            { value: "top", label: "Top" },
            { value: "bottom", label: "Bottom" },
          ]}
          value={navigationPlacement.value}
          onChange={navigationPlacement.setValue}
        />
        {navigationPlacement.value === "top" || navigationPlacement.value === "bottom" ? (
          <ToggleRow
            nested
            label="Show labels"
            description="Section names under the icons. Off keeps the pill icon-only and slimmer."
            value={navigationLabels.value}
            onChange={navigationLabels.setValue}
          />
        ) : null}
      </View>

      <View style={styles.group}>
        <Text style={styles.groupTitle}>Focus</Text>
        <ChoiceRow
          label="Focus highlight"
          description="How the highlighted poster, card or photo is marked."
          options={[
            { value: "outline", label: "Outline" },
            { value: "glow", label: "Glow" },
          ]}
          value={focusIndicator.value}
          onChange={focusIndicator.setValue}
        />
      </View>
    </ScrollView>
  );
}

const CONTENT_PADDING_TOP = space(4);
const CONTENT_PADDING_BOTTOM = space(6);

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    gap: space(3),
    maxWidth: 900,
  },
  title: {
    ...theme.type.title,
    color: theme.colors.text,
  },
  group: {
    gap: space(1.5),
  },
  groupTitle: {
    ...theme.type.eyebrow,
    color: theme.colors.muted,
  },
  groupNote: {
    ...theme.type.caption,
    color: theme.colors.muted,
    marginBottom: space(0.5),
  },
});
