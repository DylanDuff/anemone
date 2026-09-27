//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { DarkTheme, type LinkingOptions, NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ItemScreen } from "../screens/ItemScreen";
import { PlayerScreen } from "../screens/PlayerScreen";
import { theme } from "../ui/theme";
import { BrowseShell } from "./BrowseShell";
import type { RootStackParamList } from "./routes";
import { useMemo } from "react";
import { useAccent } from "../settings";

const Stack = createNativeStackNavigator<RootStackParamList>();

const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [],
  config: {
    screens: {
      Browse: {
        path: "",
        screens: {
          Home: "",
          Library: "library/:libraryID",
          Search: "search",
          Settings: "settings",
          SettingsPage: "settings/:page",
          AdminSessions: "settings/sessions",
          AdminSession: "settings/sessions/:sessionID",
          AdminActivity: "settings/activity",
          AdminActivityEntry: { path: "settings/activity/:entryID", parse: { entryID: Number } },
          AdminDevices: "settings/devices",
          AdminDevice: "settings/devices/:deviceID",
          AdminUsers: "settings/users",
          AdminAddUser: "settings/users/new",
          AdminUser: "settings/users/:userID",
          AdminUserPermissions: "settings/users/:userID/permissions",
          AdminUserPassword: "settings/users/:userID/password",
        },
      },
      Item: "item/:itemID",
      Player: {
        path: "play/:itemID",
        parse: { startTicks: Number },
      },
    },
  },
};

function navigationTheme(accent: string) {
  return {
    ...DarkTheme,
    colors: {
      ...DarkTheme.colors,
      background: theme.colors.background,
      card: theme.colors.background,
      primary: accent,
      text: theme.colors.text,
    },
  };
}

/**
 * The signed-in navigation stack: `Browse` (section switcher + Home / a library) with item pages
 * pushed full-screen over it (Item → Item …). Screens draw their own chrome, so native headers are
 * hidden.
 */
export function RootStack() {
  const accent = useAccent().color;
  const navTheme = useMemo(() => navigationTheme(accent), [accent]);
  return (
    <NavigationContainer
      linking={linking}
      theme={navTheme}
      documentTitle={{
        formatter: (options) => (options?.title ? `${options.title} · Anemone` : "Anemone"),
      }}
    >
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: theme.colors.background },
        }}
      >
        <Stack.Screen name="Browse" component={BrowseShell} />
        <Stack.Screen name="Item" component={ItemScreen} />
        <Stack.Screen
          name="Player"
          component={PlayerScreen}
          options={{
            animation: "fade",
            contentStyle: { backgroundColor: theme.colors.black },
            statusBarHidden: true,
            navigationBarHidden: true,
            autoHideHomeIndicator: true,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
