//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { Platform } from "react-native";
import { isTV } from "./tv";

/**
 * Whether form controls (switches, text fields) render the platform's own via `@expo/ui`:
 * SwiftUI on iOS/iPadOS/tvOS (so tvOS text fields open its full-screen keyboard), Jetpack Compose on
 * Android phones. Android TV and web draw our themed controls instead — Compose views don't join
 * the TV focus engine, and the web has no native look to match.
 */
export const nativeControls = Platform.OS === "ios" || (Platform.OS === "android" && !isTV);
