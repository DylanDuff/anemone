//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// iOS, iPadOS and tvOS: settings as a SwiftUI `Form` (inset-grouped sections, the system's own
// switches, menu pickers and focus), drawn in our colours rather than the system's grouped greys.
//

import { TextInput } from "@expo/ui";
import {
  Button,
  Circle,
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
  ZStack,
} from "@expo/ui/swift-ui";
import {
  accessibilityLabel,
  buttonStyle,
  disabled as disabledModifier,
  font,
  foregroundStyle,
  frame,
  listRowBackground,
  listRowInsets,
  onGeometryChange,
  padding,
  pickerStyle,
  scrollContentBackground,
  scrollIndicators,
  strokeBorder,
  tag,
  tint,
} from "@expo/ui/swift-ui/modifiers";
import { useRef, useState } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { useContentLayout } from "../contentLayout";
import { space, theme } from "../theme";
import { PAGE_PADDING_BOTTOM, PAGE_PADDING_TOP, PageHeader } from "../PageHeader";
import {
  SETTING_ICON_FRAME,
  SETTING_ICON_SIZE,
  SETTINGS_MAX_WIDTH,
  SWATCH_GAP,
  SWATCH_RING_GAP,
  SWATCH_RING_WIDTH,
  SWATCH_SLOT,
} from "./layout";
import type {
  ActionSettingProps,
  ChoiceSettingProps,
  InfoSettingProps,
  LinkSettingProps,
  SettingsListProps,
  SettingsSectionProps,
  SwatchSettingProps,
  TextSettingProps,
  ToggleSettingProps,
} from "./types";
import { useAccent } from "../../settings";

/** The inset-grouped `Form`'s own side margin; our layout inset replaces it, not adds to it. */
const FORM_MARGIN = space(2.5);

const FORM_MODIFIERS = [scrollContentBackground("hidden"), scrollIndicators("hidden")];
const ROW = listRowBackground(theme.colors.surface);
const MUTED = foregroundStyle(theme.colors.muted);
const PRIMARY = foregroundStyle(theme.colors.text);

/** Where the `Form` puts its first section header, relative to the `Form`. */
interface FormOffset {
  readonly x: number;
  readonly y: number;
}

interface Frame {
  readonly x: number;
  readonly y: number;
}

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
  const accent = useAccent().color;
  const [offset, setOffset] = useState<FormOffset>();
  const formFrame = useRef<Frame>(undefined);
  const headerFrame = useRef<Frame>(undefined);

  // Both frames come from SwiftUI's own layout (React Native can't measure inside an
  // `RNHostView`), so they agree even mid-transition. The side offset tracks the geometry
  // (rotation); the top offset is taken once, at mount — the list starts at the top, and later the
  // header moves because it scrolls, which must not be corrected.
  const update = () => {
    const form = formFrame.current;
    const header = headerFrame.current;
    if (!form || !header) {
      return;
    }
    const x = header.x - form.x;
    setOffset((current) =>
      current && Math.abs(current.x - x) < 0.5 ? current : { x, y: current?.y ?? header.y - form.y },
    );
  };
  const onFormGeometry = (frame: Frame) => {
    formFrame.current = frame;
    update();
  };
  const onHeaderGeometry = (frame: Frame) => {
    headerFrame.current = frame;
    update();
  };

  return (
    <View style={styles.screen}>
      <View
        style={[
          styles.form,
          { marginLeft: hostMarginLeft, marginRight: Math.max(0, insetRight - FORM_MARGIN) },
        ]}
      >
      <Host colorScheme="dark" seedColor={accent} ignoreSafeArea="container" style={styles.host}>
        <Form modifiers={[...FORM_MODIFIERS, onGeometryChange(onFormGeometry)]}>
          <Section
            header={
              <VStack modifiers={[...BARE_HEADER, onGeometryChange(onHeaderGeometry)]}>
                <RNHostView matchContents>
                  {/* Mounted only once placed: hiding it (opacity 0) until then left iOS's glass
                      blur (the Back chevron) undrawn on some pages. The empty slot is enough to
                      measure. */}
                  <View style={offset ? null : styles.measuring}>
                    {offset ? (
                      <PageHeader
                        title={title}
                        back={back}
                        style={{
                          paddingTop: Math.max(0, PAGE_PADDING_TOP + insetTop - offset.y),
                          // The header slot keeps its own leading inset; shift the header back
                          // (or on) so the title starts at `insetLeft`, as on every other page.
                          transform: [{ translateX: insetLeft - hostMarginLeft - offset.x }],
                          marginBottom: 0,
                        }}
                      />
                    ) : null}
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
  // Its own tint (not the form's accent): the thumb is always white, so White needs a darker track.
  const track = useAccent().switchTrack;
  return (
    <Toggle isOn={value} onIsOnChange={onChange} modifiers={[ROW, tint(track)]}>
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
  const accent = useAccent().color;
  return (
    <Button onPress={onPress} modifiers={[ROW]}>
      <HStack spacing={12}>
        {icon ? (
          <Image
            systemName={icon.systemImage}
            size={SETTING_ICON_SIZE}
            color={accent}
            modifiers={[frame({ width: SETTING_ICON_FRAME })]}
          />
        ) : null}
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

/**
 * Ink wells: one borderless button per colour (so each is its own tap target — and on tvOS its own
 * focus stop), the chosen one ringed in white whatever the accent.
 */
export function SwatchSetting<Value extends string>({
  label,
  description,
  options,
  value,
  onChange,
}: SwatchSettingProps<Value>) {
  return (
    <VStack alignment="leading" spacing={12} modifiers={[ROW]}>
      <RowLabel label={label} description={description} />
      <HStack spacing={SWATCH_GAP}>
        {options.map((option) => {
          const selected = option.value === value;
          return (
            <Button
              key={option.value}
              onPress={() => onChange(option.value)}
              modifiers={[
                buttonStyle(Platform.isTV ? "plain" : "borderless"),
                accessibilityLabel(selected ? `${option.label}, selected` : option.label),
              ]}
            >
              <ZStack modifiers={[frame({ width: SWATCH_SLOT, height: SWATCH_SLOT })]}>
                {selected ? (
                  <Circle
                    modifiers={[
                      strokeBorder({
                        content: theme.colors.white,
                        style: { lineWidth: SWATCH_RING_WIDTH },
                        shape: "circle",
                      }),
                      frame({ width: SWATCH_SLOT, height: SWATCH_SLOT }),
                    ]}
                  />
                ) : null}
                {/* Inset from the slot by the ring and its gap (a frame on the circle itself was
                    ignored, so it filled the slot and the ring sat on its edge). */}
                <Circle
                  modifiers={[
                    foregroundStyle(option.color),
                    padding({ all: SWATCH_RING_WIDTH + SWATCH_RING_GAP }),
                    frame({ width: SWATCH_SLOT, height: SWATCH_SLOT }),
                  ]}
                />
              </ZStack>
            </Button>
          );
        })}
      </HStack>
    </VStack>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  // Laid out (to be measured) but not shown until the header can be placed.
  // The header slot before the header is placed: something to measure, nothing to see.
  measuring: {
    height: 1,
  },
  host: {
    flex: 1,
  },
  form: {
    flex: 1,
    maxWidth: SETTINGS_MAX_WIDTH + FORM_MARGIN * 2,
  },
});
