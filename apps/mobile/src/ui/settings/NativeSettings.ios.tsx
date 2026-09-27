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
  RNHostView,
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
  listRowInsets,
  onGeometryChange,
  pickerStyle,
  scrollContentBackground,
  scrollIndicators,
  tag,
} from "@expo/ui/swift-ui/modifiers";
import { useRef, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useContentLayout } from "../contentLayout";
import { space, theme } from "../theme";
import { PAGE_PADDING_BOTTOM, PAGE_PADDING_TOP, PageHeader } from "../PageHeader";
import { SETTINGS_MAX_WIDTH } from "./layout";
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

/** Where the `Form` puts its first section header inside its host, once measured. */
interface FormOffset {
  readonly x: number;
  readonly y: number;
}

/**
 * The `Form` adds its own top space (and the header's side inset) that SwiftUI doesn't expose.
 * The first settings page measures it; every later one reuses it, so it doesn't re-measure.
 */
let measuredFormOffset: FormOffset | undefined;

/** Lets section headers and footers hug their React Native content. */
const BARE_HEADER = [listRowInsets({ top: 0, leading: 0, bottom: 0, trailing: 0 })];

/**
 * The whole page is one native `Form` running under the navigation pill, like every other page.
 * The `PageHeader` is an empty first section's header — a section *row* would be clipped by the
 * card's rounded corners — so it scrolls away with the content, and an empty last section's footer
 * lets the last card clear the pill. The header is padded from the measured `Form` offset so the
 * title lands exactly where it does on Search and the libraries; it stays hidden until then.
 */
export function SettingsList({ title, back, children }: SettingsListProps) {
  const { insetLeft, insetRight, insetTop, insetBottom } = useContentLayout();
  const hostMarginLeft = Math.max(0, insetLeft - FORM_MARGIN);
  const host = useRef<View>(null);
  const [offset, setOffset] = useState(measuredFormOffset);

  // The header's frame comes from SwiftUI (window coordinates): React Native measurements inside
  // an `RNHostView` are relative to the host view, not the window.
  const measure = (frame: { x: number; y: number }) => {
    if (offset) {
      return;
    }
    host.current?.measureInWindow((hostX, hostY) => {
      measuredFormOffset = { x: frame.x - hostX, y: frame.y - hostY };
      setOffset(measuredFormOffset);
    });
  };

  return (
    <View style={styles.screen}>
      <View
        ref={host}
        collapsable={false}
        style={[
          styles.form,
          { marginLeft: hostMarginLeft, marginRight: Math.max(0, insetRight - FORM_MARGIN) },
        ]}
      >
      <Host colorScheme="dark" seedColor={theme.colors.accent} ignoreSafeArea="container" style={styles.host}>
        <Form modifiers={FORM_MODIFIERS}>
          <Section
            header={
              <VStack modifiers={[...BARE_HEADER, onGeometryChange(measure)]}>
                <RNHostView matchContents>
                  <View style={offset ? null : styles.measuring}>
                    <PageHeader
                      title={title}
                      back={back}
                      style={{
                        paddingTop: Math.max(0, PAGE_PADDING_TOP + insetTop - (offset?.y ?? 0)),
                        // The header slot keeps its own leading inset; shift the header back
                        // (or on) so the title starts at `insetLeft`, as on every other page.
                        transform: [{ translateX: insetLeft - hostMarginLeft - (offset?.x ?? 0) }],
                        marginBottom: 0,
                      }}
                    />
                  </View>
                </RNHostView>
              </VStack>
            }
          >
            {null}
          </Section>
          {children}
          <Section
            footer={
              <VStack modifiers={BARE_HEADER}>
                <RNHostView matchContents>
                  <View style={{ height: PAGE_PADDING_BOTTOM + insetBottom }} />
                </RNHostView>
              </VStack>
            }
          >
            {null}
          </Section>
        </Form>
      </Host>
      </View>
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
  // Laid out (to be measured) but not shown until the header can be placed.
  measuring: {
    opacity: 0,
  },
  host: {
    flex: 1,
  },
  form: {
    flex: 1,
    maxWidth: SETTINGS_MAX_WIDTH + FORM_MARGIN * 2,
  },
});
