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
} from "react-native";
import { hoverTransition } from "./Focusable";
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
}

/**
 * A single-line text field. With `nativeControls` it's the platform's own (on tvOS, selecting it
 * opens the system keyboard screen), styled from the theme; otherwise a themed React Native input
 * with a focus border (Android TV's own keyboard still opens for it).
 */
export function TextField({ onSubmit, ...props }: TextFieldProps) {
  const [focused, setFocused] = useState(false);

  if (nativeControls) {
    return (
      <Host
        matchContents={{ vertical: true }}
        colorScheme="dark"
        seedColor={theme.colors.accent}
        style={styles.nativeHost}
      >
        <NativeTextInput
          {...props}
          onSubmitEditing={onSubmit}
          placeholderTextColor={theme.colors.muted}
          cursorColor={theme.colors.accent}
          textStyle={{ fontSize: theme.type.label.fontSize, color: theme.colors.text }}
          style={{
            paddingHorizontal: FIELD_PADDING_HORIZONTAL,
            paddingVertical: FIELD_PADDING_VERTICAL,
            backgroundColor: theme.colors.surface,
            borderRadius: theme.radii.lg,
          }}
        />
      </Host>
    );
  }

  return (
    <TextInput
      {...props}
      onSubmitEditing={(event) => onSubmit?.(event.nativeEvent.text)}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      placeholderTextColor={theme.colors.muted}
      selectionColor={theme.colors.accent}
      style={[styles.field, hoverTransition, focused ? styles.fieldFocused : null]}
    />
  );
}

const FIELD_PADDING_HORIZONTAL = space(2);
const FIELD_PADDING_VERTICAL = space(1.5);

const styles = StyleSheet.create({
  nativeHost: {
    alignSelf: "stretch",
  },
  field: {
    ...theme.type.label,
    fontWeight: theme.weight.regular,
    color: theme.colors.text,
    paddingHorizontal: FIELD_PADDING_HORIZONTAL,
    paddingVertical: FIELD_PADDING_VERTICAL,
    backgroundColor: theme.colors.surface,
    borderRadius: theme.radii.lg,
    borderWidth: 2,
    borderColor: "transparent",
    // Web draws its own focus outline; the border is the indicator here.
    outlineStyle: "none",
  } as object,
  fieldFocused: {
    borderColor: theme.colors.accent,
  },
});
