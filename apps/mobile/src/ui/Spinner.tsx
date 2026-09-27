//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { ActivityIndicator, type StyleProp, type ViewStyle } from "react-native";
import { useAccent } from "../settings";

/** The app's loading spinner, in the accent colour. */
export function Spinner({ style }: { style?: StyleProp<ViewStyle> }) {
  return <ActivityIndicator color={useAccent().color} style={style} />;
}
