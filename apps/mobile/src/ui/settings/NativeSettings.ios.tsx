//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// iOS, iPadOS and tvOS: settings as a SwiftUI `Form` (inset-grouped sections, the system's own
// switches, menu pickers and focus), drawn in our colours rather than the system's grouped greys.
//

import { TextInput } from "@expo/ui";
import {
  Button,
  Form,
  HStack,
  Host,
  Image,
  LabeledContent,
  Picker,
  Section,
  Spacer,
  Text,
  Toggle,
  VStack,
} from "@expo/ui/swift-ui";
import {
  disabled as disabledModifier,
  font,
  foregroundStyle,
  listRowBackground,
  pickerStyle,
  scrollContentBackground,
  scrollIndicators,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import { StyleSheet, View } from "react-native";
import { useContentLayout } from "../contentLayout";
import { space, theme } from "../theme";
import {
  SETTINGS_MAX_WIDTH,
  SETTINGS_PADDING_TOP,
  SettingsHeader,
} from "./SettingsHeader";
import type {
  ActionSettingProps,
  ChoiceSettingProps,
  InfoSettingProps,
  LinkSettingProps,
  SettingsListProps,
  SettingsSectionProps,
  TextSettingProps,
  ToggleSettingProps,
} from "./types";

/** The inset-grouped `Form`'s own side margin; our layout inset replaces it, not adds to it. */
const FORM_MARGIN = space(2.5);

const FORM_MODIFIERS = [scrollContentBackground("hidden"), scrollIndicators("hidden")];
const ROW = listRowBackground(theme.colors.surface);
const MUTED = foregroundStyle(theme.colors.muted);
const PRIMARY = foregroundStyle(theme.colors.text);

/**
 * The page header stays in React Native (it matches the other pages); the `Form` below it scrolls
 * natively. The form can't scroll under a floating pill, so it stops short of it.
 */
export function SettingsList({ title, back, children }: SettingsListProps) {
  const { insetLeft, insetRight, insetTop, insetBottom } = useContentLayout();
  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.header,
          { paddingTop: SETTINGS_PADDING_TOP + insetTop, paddingLeft: insetLeft, paddingRight: insetRight },
        ]}
      >
        <SettingsHeader title={title} back={back} />
      </View>
      <Host
        colorScheme="dark"
        seedColor={theme.colors.accent}
        style={[
          styles.form,
          {
            marginLeft: Math.max(0, insetLeft - FORM_MARGIN),
            marginRight: Math.max(0, insetRight - FORM_MARGIN),
            marginBottom: insetBottom,
          },
        ]}
      >
        <Form modifiers={FORM_MODIFIERS}>{children}</Form>
      </Host>
    </View>
  );
}

export function SettingsSection({ title, footer, children }: SettingsSectionProps) {
  return (
    <Section title={title} footer={footer ? <Text modifiers={[MUTED]}>{footer}</Text> : undefined}>
      {children}
    </Section>
  );
}

/** A row's label: the title, with the description as a smaller secondary line under it. */
function RowLabel({ label, description }: { label: string; description?: string }) {
  return (
    <VStack alignment="leading" spacing={2}>
      <Text modifiers={[PRIMARY]}>{label}</Text>
      {description ? (
        <Text modifiers={[font({ textStyle: "footnote" }), MUTED]}>{description}</Text>
      ) : null}
    </VStack>
  );
}

export function ToggleSetting({ label, description, value, onChange }: ToggleSettingProps) {
  return (
    <Toggle isOn={value} onIsOnChange={onChange} modifiers={[ROW]}>
      <RowLabel label={label} description={description} />
    </Toggle>
  );
}

/** The system menu picker: the current choice on the trailing edge, opening a checked menu. */
export function ChoiceSetting<Value extends string>({
  label,
  description,
  options,
  value,
  onChange,
}: ChoiceSettingProps<Value>) {
  return (
    <Picker
      label={<RowLabel label={label} description={description} />}
      selection={value}
      onSelectionChange={(selection) => onChange(selection as Value)}
      modifiers={[pickerStyle("menu"), ROW]}
    >
      {options.map((option) => (
        <Text key={option.value} modifiers={[tag(option.value)]}>
          {option.label}
        </Text>
      ))}
    </Picker>
  );
}

export function LinkSetting({ label, icon, detail, onPress }: LinkSettingProps) {
  return (
    <Button onPress={onPress} modifiers={[ROW]}>
      <HStack spacing={12}>
        {icon ? <Image systemName={icon.systemImage} color={theme.colors.accent} /> : null}
        <Text modifiers={[PRIMARY]}>{label}</Text>
        <Spacer />
        {detail ? <Text modifiers={[MUTED]}>{detail}</Text> : null}
        <Image systemName="chevron.right" size={13} color={theme.colors.muted} />
      </HStack>
    </Button>
  );
}

export function InfoSetting({ label, description, value }: InfoSettingProps) {
  return (
    <LabeledContent label={<RowLabel label={label} description={description} />} modifiers={[ROW]}>
      <Text modifiers={[MUTED]}>{value ?? ""}</Text>
    </LabeledContent>
  );
}

export function ActionSetting({
  label,
  onPress,
  destructive = false,
  busy = false,
  disabled = false,
}: ActionSettingProps) {
  return (
    <Button
      label={label}
      role={destructive ? "destructive" : "default"}
      onPress={onPress}
      modifiers={[ROW, disabledModifier(busy || disabled)]}
    />
  );
}

/** A plain `Form` text field (a `SecureField` when `secureTextEntry`). */
export function TextSetting({
  label,
  defaultValue,
  onChangeText,
  secureTextEntry,
  autoCapitalize,
}: TextSettingProps) {
  return (
    <TextInput
      placeholder={label}
      defaultValue={defaultValue}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      autoCapitalize={autoCapitalize}
      autoCorrect={false}
      modifiers={[ROW]}
    />
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    maxWidth: SETTINGS_MAX_WIDTH,
  },
  form: {
    flex: 1,
    maxWidth: SETTINGS_MAX_WIDTH + FORM_MARGIN * 2,
  },
});
