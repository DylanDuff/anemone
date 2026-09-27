//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { useNavigationState } from "@react-navigation/native";
import { createNativeStackNavigator, type NativeStackScreenProps } from "@react-navigation/native-stack";
import { type ComponentRef, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import {
  ActivityEntryScreen,
  ActivityScreen,
  AddUserScreen,
  DeviceScreen,
  DevicesScreen,
  SessionScreen,
  SessionsScreen,
  UserPasswordScreen,
  UserPermissionsScreen,
  UserScreen,
  UsersScreen,
} from "../screens/admin";
import { HomeScreen } from "../screens/HomeScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import { SearchScreen } from "../screens/SearchScreen";
import { SettingsPageScreen } from "../screens/settings/SettingsPageScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { ContentLayoutProvider, useIsCompact } from "../ui/contentLayout";
import { GlassBackdrop, GlassScope } from "../ui/Glass";
import { PageScrollProvider, ScrollMinimizeStore } from "../ui/pageScroll";
import { useNavigationLabelsSetting, useNavigationPlacementSetting } from "../settings";
import { type PillForm, SectionRail, usePillContentInsets } from "../ui/SectionRail";
import { theme } from "../ui/theme";
import { FocusGuide } from "../ui/tv";
import {
  type BrowseParamList,
  type RootStackParamList,
  isSettingsRoute,
  type Section,
  useOpenSection,
} from "./routes";
import { useSectionEntries } from "./sections";

const SectionStack = createNativeStackNavigator<BrowseParamList>();

type BrowseProps = NativeStackScreenProps<RootStackParamList, "Browse">;

/** Minimal shape of the section stack's state, as nested in the root stack's state. */
interface NestedState {
  readonly index?: number;
  readonly routes: ReadonlyArray<{ readonly name: string; readonly params?: object }>;
}

/**
 * The section currently shown, from the section stack's state — or, before it has mounted (e.g. a
 * deep link), from the params used to navigate here.
 */
function activeSection(state: NestedState | undefined, params: BrowseProps["route"]["params"]): Section {
  const focused = state
    ? state.routes[state.index ?? state.routes.length - 1]
    : params
      ? { name: params.screen, params: params.params }
      : undefined;
  if (focused?.name && isSettingsRoute(focused.name)) {
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
  // Read from the navigation state tree, not `route`: the route prop doesn't carry the nested
  // stack's state, so gestures (iOS swipe back) that change only the stack wouldn't update the pill.
  const sectionState = useNavigationState(
    (state) => state.routes.find((candidate) => candidate.key === route.key)?.state as NestedState | undefined,
  );
  const section = activeSection(sectionState, route.params);
  const entries = useSectionEntries(section);
  const openSection = useOpenSection();
  // Phones always get a small icon-only pill along the bottom; wide screens choose in Settings.
  const compact = useIsCompact();
  const placement = useNavigationPlacementSetting().value;
  const labels = useNavigationLabelsSetting().value;
  const form: PillForm = compact
    ? { placement: "bottom", compact, labels: false }
    : { placement, compact, labels };
  const { insetLeft, insetRight, insetTop, insetBottom } = usePillContentInsets(form);
  // A new object would re-render every layout consumer in every mounted section; only change it
  // when a number does.
  const contentLayout = useMemo(
    () => ({ width, insetLeft, insetRight, insetTop, insetBottom }),
    [width, insetLeft, insetRight, insetTop, insetBottom],
  );
  // The phone pill shrinks while the page scrolls down (only the pill re-renders for it); a newly
  // shown section starts full size.
  const [scrollMinimize] = useState(() => new ScrollMinimizeStore());
  const sectionKey = section.kind === "library" ? section.libraryID : section.kind;
  useEffect(scrollMinimize.reset, [sectionKey, scrollMinimize]);
  // The page's focus guide remembers its last focused item (`autoFocus`), so focusing the guide
  // returns there — used when Back (or the page's direction) dismisses the pill.
  const pageGuide = useRef<ComponentRef<typeof FocusGuide>>(null);
  const returnToPage = useCallback(() => pageGuide.current?.requestTVFocus?.(), []);

  const sections = (
    <SectionStack.Navigator screenOptions={SECTION_SCREEN_OPTIONS}>
      <SectionStack.Screen name="Home" component={HomeScreen} />
      <SectionStack.Screen name="Search" component={SearchScreen} />
      <SectionStack.Screen name="Library" component={LibraryScreen} />
      <SectionStack.Screen name="Settings" component={SettingsScreen} />
      <SectionStack.Group screenOptions={SETTINGS_PAGE_OPTIONS}>
        <SectionStack.Screen name="SettingsPage" component={SettingsPageScreen} />
        <SectionStack.Screen name="AdminSessions" component={SessionsScreen} />
        <SectionStack.Screen name="AdminSession" component={SessionScreen} />
        <SectionStack.Screen name="AdminActivity" component={ActivityScreen} />
        <SectionStack.Screen name="AdminActivityEntry" component={ActivityEntryScreen} />
        <SectionStack.Screen name="AdminDevices" component={DevicesScreen} />
        <SectionStack.Screen name="AdminDevice" component={DeviceScreen} />
        <SectionStack.Screen name="AdminUsers" component={UsersScreen} />
        <SectionStack.Screen name="AdminAddUser" component={AddUserScreen} />
        <SectionStack.Screen name="AdminUser" component={UserScreen} />
        <SectionStack.Screen name="AdminUserPermissions" component={UserPermissionsScreen} />
        <SectionStack.Screen name="AdminUserPassword" component={UserPasswordScreen} />
      </SectionStack.Group>
    </SectionStack.Navigator>
  );

  return (
    <GlassScope>
      <View style={styles.shell}>
        {/* The page runs full size beneath the floating pill: content starts clear of it (and
            scrolls under it), hero artwork bleeds beneath it. It's also what the pill's glass blurs. */}
        <FocusGuide ref={pageGuide} autoFocus style={styles.content}>
          <GlassBackdrop style={styles.content}>
            <ContentLayoutProvider value={contentLayout}>
              <PageScrollProvider value={scrollMinimize.report}>{sections}</PageScrollProvider>
            </ContentLayoutProvider>
          </GlassBackdrop>
        </FocusGuide>
        <SectionRail
          entries={entries}
          form={form}
          scrollMinimize={scrollMinimize}
          onSelect={openSection}
          onDismiss={returnToPage}
        />
      </View>
    </GlassScope>
  );
}

/** Constant, so the section navigator doesn't recompute every screen's options on each render. */
const SECTION_SCREEN_OPTIONS = {
  headerShown: false,
  animation: "none",
  contentStyle: { backgroundColor: theme.colors.background },
} as const;

/** Settings and admin pages push like any drill-down (with the back swipe on iOS). */
const SETTINGS_PAGE_OPTIONS = { animation: "default" } as const;

const styles = StyleSheet.create({
  shell: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
});
