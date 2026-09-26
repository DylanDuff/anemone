//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { createNativeStackNavigator, type NativeStackScreenProps } from "@react-navigation/native-stack";
import { type ComponentRef, useCallback, useRef } from "react";
import { StyleSheet, useWindowDimensions, View } from "react-native";
import { HomeScreen } from "../screens/HomeScreen";
import { LibraryScreen } from "../screens/LibraryScreen";
import { SettingsScreen } from "../screens/SettingsScreen";
import { ContentLayoutProvider, useIsCompact } from "../ui/contentLayout";
import { GlassBackdrop, GlassScope } from "../ui/Glass";
import { RAIL_CONTENT_INSET, SectionRail } from "../ui/SectionRail";
import { SectionTabBar } from "../ui/SectionTabBar";
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
  const libraryID = (focused?.params as { libraryID?: string } | undefined)?.libraryID;
  return focused?.name === "Library" && libraryID ? { kind: "library", libraryID } : { kind: "home" };
}

/**
 * The top-level browsing shell: the section switcher beside (or below) a nested stack showing the
 * current section. The switcher stays mounted across section changes, so D-pad focus stays put.
 */
export function BrowseShell({ route }: BrowseProps) {
  const { width } = useWindowDimensions();
  const entries = useSectionEntries(activeSection(route));
  const openSection = useOpenSection();
  // Phones get a bottom tab bar instead of the rail.
  const compact = useIsCompact();
  // The page's focus guide remembers its last focused item (`autoFocus`), so focusing the guide
  // returns there — used when Back/Right dismisses the rail.
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
      <SectionStack.Screen name="Library" component={LibraryScreen} />
      <SectionStack.Screen name="Settings" component={SettingsScreen} />
    </SectionStack.Navigator>
  );

  if (compact) {
    return (
      <View style={styles.column}>
        <View style={styles.content}>{sections}</View>
        <SectionTabBar entries={entries} onSelect={openSection} />
      </View>
    );
  }

  return (
    <GlassScope>
      <View style={styles.row}>
        {/* The page runs full width beneath the floating rail: content starts past it (and
            scrolls under it), hero artwork bleeds beneath it. It's also what the rail's glass blurs. */}
        <FocusGuide ref={pageGuide} autoFocus style={styles.content}>
          <GlassBackdrop style={styles.content}>
            <ContentLayoutProvider value={{ width, insetLeft: RAIL_CONTENT_INSET }}>
              {sections}
            </ContentLayoutProvider>
          </GlassBackdrop>
        </FocusGuide>
        <SectionRail entries={entries} onSelect={openSection} onDismiss={returnToPage} />
      </View>
    </GlassScope>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  column: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    flex: 1,
  },
});
