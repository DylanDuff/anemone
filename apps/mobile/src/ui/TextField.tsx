//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { Host, TextInput as NativeTextInput } from "@expo/ui";
import { useState } from "react";
import {
  type KeyboardTypeOptions,
  TextInput,
  type ReturnKeyTypeOptions,
  StyleSheet,
  View,
} from "react-native";
import { useAccent, useGlassButtons } from "../settings";
import { hoverTransition } from "./Focusable";
import { GlassFill, glassFillHost } from "./Glass";
import { Icon, type IconName } from "./Icon";
import { nativeControls } from "./nativeControls";
import { space, theme } from "./theme";

export interface TextFieldProps {
  placeholder?: string;
  defaultValue?: string;
  onChangeText: (text: string) => void;
  /** Called with the final text when the keyboard's return / submit key is pressed. */
  onSubmit?: (text: string) => void;
  secureTextEntry?: boolean;
  autoFocus?: boolean;
  keyboardType?: KeyboardTypeOptions;
  returnKeyType?: ReturnKeyTypeOptions;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  autoCorrect?: boolean;
  /** Frost the field like the glass buttons (Settings → Glass buttons), e.g. the search field. */
  glass?: boolean;
  /** Shown inside the field's leading edge (e.g. a magnifying glass for search). */
  icon?: IconName;
  /** Fully rounded ends (a capsule) instead of rounded corners — the search field. */
  pill?: boolean;
}

/**
 * A single-line text field. With `nativeControls` it's the platform's own (on tvOS, selecting it
 * opens the system keyboard screen), styled from the theme; otherwise a themed React Native input
 * with a focus border (Android TV's own keyboard still opens for it). `icon` sits inside the
 * leading edge; `pill` rounds its ends fully; with `glass` (and the setting on) the field is frosted
 * instead of surface-coloured.
 */
export function TextField({ onSubmit, glass = false, icon, pill = false, ...props }: TextFieldProps) {
  const [focused, setFocused] = useState(false);
  const radius = pill ? theme.radii.pill : theme.radii.lg;
  const frosted = useGlassButtons() && glass;
  const accent = useAccent().color;
  const fill = frosted ? glassFillHost.backgroundColor : theme.colors.surface;
  // A fixed height (text centred in it) rather than padding: the native field's host can't be
  // trusted to size itself to the padded field, and the glass fill takes the host's size.
  const padding = {
    paddingLeft: icon ? ICON_INSET + ICON_SIZE + ICON_GAP : FIELD_PADDING_HORIZONTAL,
    paddingRight: FIELD_PADDING_HORIZONTAL,
    height: FIELD_HEIGHT,
  };

  const field = nativeControls ? (
    <Host
      colorScheme="dark"
      seedColor={accent}
      // The field never avoids the keyboard itself: SwiftUI would shift it inside its host (off its
      // glass) while a `KeyboardDock` is already lifting the whole field above the keyboard.
      ignoreSafeArea="keyboard"
      style={styles.nativeHost}
    >
      <NativeTextInput
        {...props}
        onSubmitEditing={onSubmit}
        placeholderTextColor={theme.colors.muted}
        cursorColor={accent}
        textStyle={{ fontSize: theme.type.label.fontSize, color: theme.colors.text }}
        style={{ ...padding, backgroundColor: fill, borderRadius: radius }}
      />
    </Host>
  ) : (
    <TextInput
      {...props}
      onSubmitEditing={(event) => onSubmit?.(event.nativeEvent.text)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholderTextColor={theme.colors.muted}
      selectionColor={accent}
      style={[
        styles.field,
        padding,
        { backgroundColor: fill, borderRadius: radius },
        hoverTransition,
        focused ? { borderColor: accent } : null,
      ]}
    />
  );

  if (!frosted && !icon) {
    return field;
  }
  return (
    <View style={[styles.stretch, frosted ? [{ borderRadius: radius }, glassFillHost] : null]}>
      {frosted ? <GlassFill radius={radius} /> : null}
      {field}
      {icon ? (
        // Drawn over the field, so taps fall through to it.
        <View style={styles.icon} pointerEvents="none">
          <Icon name={icon} size={ICON_SIZE} color={theme.colors.muted} />
        </View>
      ) : null}
    </View>
  );
}

const FIELD_PADDING_HORIZONTAL = space(2);
/** Every field's height: a comfortable tap target that fits the label type. */
const FIELD_HEIGHT = space(6);
const ICON_SIZE = 18;
/** The themed field's 2pt focus border sits inside its padding; line the icon up with the text. */
const ICON_INSET = FIELD_PADDING_HORIZONTAL;
const ICON_GAP = space(1);

const styles = StyleSheet.create({
  stretch: {
    alignSelf: "stretch",
  },
  nativeHost: {
    alignSelf: "stretch",
    height: FIELD_HEIGHT,
  },
  icon: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: ICON_INSET,
    justifyContent: "center",
  },
  field: {
    ...theme.type.label,
    fontWeight: theme.weight.regular,
    color: theme.colors.text,
    borderWidth: 2,
    borderColor: "transparent",
    // Web draws its own focus outline; the border is the indicator here.
    outlineStyle: "none",
  } as object,
});
