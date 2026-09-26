//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { createNativeStackNavigator, type NativeStackScreenProps } from "@react-navigation/native-stack";
import { type ComponentRef, useCallback, useEffect, useRef } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { HomeScreen } from "../screens/HomeScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { ContentLayoutProvider, useIsCompact } from "../ui/contentLayout";
import { GlassBackdrop, GlassScope } from "../ui/Glass";
import { PageScrollProvider, useScrollMinimize } from "../ui/pageScroll";
import { useNavigationLabelsSetting, useNavigationPlacementSetting } from "../settings";
import { type PillForm, SectionRail, usePillContentInsets } from "../ui/SectionRail";
import { theme } from "../ui/theme";
import { FocusGuide } from "../ui/tv";
import {
  type BrowseParamList,
  type RootStackParamList,
  type Section,
  useOpenSection,
} from "./routes";
import { useSectionEntries } from "./sections";

const SectionStack = createNativeStackNavigator<BrowseParamList>();

type BrowseProps = NativeStackScreenProps<RootStackParamList, "Browse">;

/** Minimal shape of a nested navigator's state as exposed on its parent route. */
interface NestedState {
  readonly index?: number;
  readonly routes: ReadonlyArray<{ readonly name: string; readonly params?: object }>;
}

/**
 * The section currently shown, from the nested stack's state — or, before it has mounted (e.g. a
 * deep link), from the params used to navigate here.
 */
function activeSection(route: BrowseProps["route"]): Section {
  const state = (route as { state?: NestedState }).state;
  const focused = state
    ? state.routes[state.index ?? state.routes.length - 1]
    : route.params
      ? { name: route.params.screen, params: route.params.params }
      : undefined;
  if (focused?.name === "Settings") {
    return { kind: "settings" };
  }
  if (focused?.name === "Search") {
    return { kind: "search" };
  }
  const libraryID = (focused?.params as { libraryID?: string } | undefined)?.libraryID;
  return focused?.name === "Library" && libraryID ? { kind: "library", libraryID } : { kind: "home" };
}

/**
 * The top-level browsing shell: the section switcher (a floating pill) over a nested stack showing
 * the current section. The switcher stays mounted across section changes, so D-pad focus stays put.
 */
export function BrowseShell({ route }: BrowseProps) {
  const { width } = useWindowDimensions();
  const section = activeSection(route);
  const entries = useSectionEntries(section);
  const openSection = useOpenSection();
  // Phones always get a small icon-only pill along the bottom; wide screens choose in Settings.
  const compact = useIsCompact();
  const placement = useNavigationPlacementSetting().value;
  const labels = useNavigationLabelsSetting().value;
  const form: PillForm = compact
    ? { placement: "bottom", compact, labels: false }
    : { placement, compact, labels };
  const insets = usePillContentInsets(form);
  // The phone pill shrinks while the page scrolls down; a newly shown section starts full size.
  const pageScroll = useScrollMinimize();
  const sectionKey = section.kind === "library" ? section.libraryID : section.kind;
  const { reset: resetPageScroll } = pageScroll;
  useEffect(resetPageScroll, [sectionKey, resetPageScroll]);
  // The page's focus guide remembers its last focused item (`autoFocus`), so focusing the guide
  // returns there — used when Back (or the page's direction) dismisses the pill.
  const pageGuide = useRef<ComponentRef<typeof FocusGuide>>(null);
  const returnToPage = useCallback(() => pageGuide.current?.requestTVFocus?.(), []);

  const sections = (
    <SectionStack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "none",
        contentStyle: { backgroundColor: theme.colors.background },
      }}
    >
      <SectionStack.Screen name="Home" component={HomeScreen} />
      <SectionStack.Screen name="Search" component={SearchScreen} />
      <SectionStack.Screen name="Library" component={LibraryScreen} />
      <SectionStack.Screen name="Settings" component={SettingsScreen} />
    </SectionStack.Navigator>
  );

  return (
    <GlassScope>
      <View style={styles.shell}>
        {/* The page runs full size beneath the floating pill: content starts clear of it (and
            scrolls under it), hero artwork bleeds beneath it. It's also what the pill's glass blurs. */}
        <FocusGuide ref={pageGuide} autoFocus style={styles.content}>
          <GlassBackdrop style={styles.content}>
            <ContentLayoutProvider value={{ width, ...insets }}>
              <PageScrollProvider value={pageScroll.report}>{sections}</PageScrollProvider>
            </ContentLayoutProvider>
          </GlassBackdrop>
        </FocusGuide>
        <SectionRail
          entries={entries}
          form={form}
          minimized={pageScroll.minimized}
          onSelect={openSection}
          onDismiss={returnToPage}
        />
      </View>
    </GlassScope>
  );
}

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
});
