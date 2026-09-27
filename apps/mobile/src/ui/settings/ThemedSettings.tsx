//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// The themed settings kit: our own grouped rows, for web and Android TV (where `nativeControls` is
// off). Every interactive row is one `Focusable`, so the D-pad and keyboard move row by row.
//

import { Fragment, type ReactNode } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import { Chip } from "../Chip";
import { useContentLayout } from "../contentLayout";
import { Focusable } from "../Focusable";
import { Icon } from "../Icon";
import { usePageScrollHandler } from "../pageScroll";
import { Switch } from "../Switch";
import { TextField } from "../TextField";
import { space, theme } from "../theme";
import {
  SETTINGS_MAX_WIDTH,
  SETTINGS_PADDING_BOTTOM,
  SETTINGS_PADDING_TOP,
  SettingsHeader,
} from "./SettingsHeader";
import {
  type ActionSettingProps,
  type ChoiceSettingProps,
  type InfoSettingProps,
  type LinkSettingProps,
  sectionRows,
  type SettingsListProps,
  type SettingsSectionProps,
  type TextSettingProps,
  type ToggleSettingProps,
} from "./types";

export function SettingsList({ title, back, children }: SettingsListProps) {
  const { insetLeft, insetRight, insetTop, insetBottom } = useContentLayout();
  const onPageScroll = usePageScrollHandler();
  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      onScroll={onPageScroll}
      scrollEventThrottle={16}
      style={styles.screen}
      contentContainerStyle={[
        styles.content,
        {
          paddingLeft: insetLeft,
          paddingRight: insetRight,
          paddingTop: SETTINGS_PADDING_TOP + insetTop,
          paddingBottom: SETTINGS_PADDING_BOTTOM + insetBottom,
        },
      ]}
    >
      <SettingsHeader title={title} back={back} />
      {children}
    </ScrollView>
  );
}

export function SettingsSection({ title, footer, children }: SettingsSectionProps) {
  const rows = sectionRows(children);
  return (
    <View style={styles.section}>
      {title ? <Text style={styles.sectionTitle}>{title}</Text> : null}
      <View style={styles.card}>
        {rows.map((row, index) => (
          <Fragment key={index}>
            {index > 0 ? <View style={styles.separator} /> : null}
            {row}
          </Fragment>
        ))}
      </View>
      {footer ? <Text style={styles.footer}>{footer}</Text> : null}
    </View>
  );
}

/** Label and optional description, inverted while the row is focused. */
function RowText({
  label,
  description,
  focused = false,
  labelColor = theme.colors.text,
  wraps = false,
}: {
  label: string;
  description?: string;
  focused?: boolean;
  labelColor?: string;
  /** Keep the text readable by wrapping the row's controls beneath it (see `ChoiceSetting`). */
  wraps?: boolean;
}) {
  return (
    <View style={[styles.text, wraps ? styles.textWrapping : null]}>
      <Text style={[styles.label, { color: focused ? theme.colors.chipActiveText : labelColor }]}>
        {label}
      </Text>
      {description ? (
        <Text style={[styles.description, focused ? styles.descriptionFocused : null]}>
          {description}
        </Text>
      ) : null}
    </View>
  );
}

/** A row that is one focus target; `content` draws it for the current focus state. */
function PressableRow({
  onPress,
  accessibilityLabel,
  accessibilityRole = "button",
  accessibilityState,
  disabled,
  preferFocus,
  content,
}: {
  onPress: () => void;
  accessibilityLabel: string;
  accessibilityRole?: "button" | "switch" | "link";
  accessibilityState?: { checked?: boolean; busy?: boolean; disabled?: boolean };
  disabled?: boolean;
  preferFocus?: boolean;
  content: (focused: boolean) => ReactNode;
}) {
  return (
    <Focusable
      onPress={onPress}
      disabled={disabled}
      hasTVPreferredFocus={preferFocus}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={accessibilityState}
      style={({ pressed, focused }) => [
        styles.row,
        focused ? styles.rowFocused : null,
        pressed ? styles.pressed : null,
      ]}
    >
      {({ focused }) => content(focused)}
    </Focusable>
  );
}

export function ToggleSetting({ label, description, value, onChange }: ToggleSettingProps) {
  return (
    <PressableRow
      onPress={() => onChange(!value)}
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      content={(focused) => (
        <>
          <RowText label={label} description={description} focused={focused} />
          <Switch value={value} onValueChange={onChange} />
        </>
      )}
    />
  );
}

/** One chip per option (each its own focus target), wrapping under the label when narrow. */
export function ChoiceSetting<Value extends string>({
  label,
  description,
  options,
  value,
  onChange,
}: ChoiceSettingProps<Value>) {
  return (
    <View style={[styles.row, styles.wrapping]}>
      <RowText label={label} description={description} wraps />
      <View style={styles.choices}>
        {options.map((option) => (
          <Chip
            key={option.value}
            label={option.label}
            selected={option.value === value}
            onPress={() => onChange(option.value)}
          />
        ))}
      </View>
    </View>
  );
}

export function LinkSetting({ label, icon, detail, onPress }: LinkSettingProps) {
  return (
    <PressableRow
      onPress={onPress}
      accessibilityRole="link"
      accessibilityLabel={detail ? `${label}: ${detail}` : label}
      content={(focused) => {
        const muted = focused ? theme.colors.chipActiveMuted : theme.colors.muted;
        return (
          <>
            {icon ? (
              <Icon
                name={icon.icon}
                color={focused ? theme.colors.chipActiveText : theme.colors.text}
              />
            ) : null}
            <RowText label={label} focused={focused} />
            {detail ? <Text style={[styles.detail, { color: muted }]}>{detail}</Text> : null}
            <Icon name="chevron-forward" size={18} color={muted} />
          </>
        );
      }}
    />
  );
}

export function InfoSetting({ label, description, value }: InfoSettingProps) {
  return (
    <View style={styles.row}>
      <RowText label={label} description={description} />
      {value ? (
        <Text style={[styles.detail, styles.value]} selectable>
          {value}
        </Text>
      ) : null}
    </View>
  );
}

export function ActionSetting({
  label,
  onPress,
  destructive = false,
  busy = false,
  disabled = false,
  preferFocus,
}: ActionSettingProps) {
  return (
    <PressableRow
      onPress={onPress}
      disabled={busy || disabled}
      preferFocus={preferFocus}
      accessibilityLabel={label}
      accessibilityState={{ busy, disabled }}
      content={(focused) => (
        <>
          <RowText
            label={label}
            focused={focused}
            labelColor={
              disabled ? theme.colors.muted : destructive ? theme.colors.error : theme.colors.accent
            }
          />
          {busy ? (
            <ActivityIndicator
              size="small"
              color={focused ? theme.colors.chipActiveText : theme.colors.muted}
            />
          ) : null}
        </>
      )}
    />
  );
}

/** Our text field, inset in the row (it draws its own focus border). */
export function TextSetting({
  label,
  defaultValue,
  onChangeText,
  secureTextEntry,
  autoCapitalize,
}: TextSettingProps) {
  return (
    <View style={styles.fieldRow}>
      <TextField
        placeholder={label}
        defaultValue={defaultValue}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  content: {
    gap: space(3),
    maxWidth: SETTINGS_MAX_WIDTH,
  },
  section: {
    gap: space(1),
  },
  sectionTitle: {
    ...theme.type.eyebrow,
    color: theme.colors.muted,
    marginHorizontal: space(2.5),
  },
  card: {
    borderRadius: theme.radii.lg,
    backgroundColor: theme.colors.surface,
    overflow: "hidden",
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: space(2.5),
    backgroundColor: theme.colors.separator,
  },
  footer: {
    ...theme.type.caption,
    color: theme.colors.muted,
    marginHorizontal: space(2.5),
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(2),
    minHeight: space(7),
    paddingVertical: space(1.5),
    paddingHorizontal: space(2.5),
  },
  wrapping: {
    flexWrap: "wrap",
    columnGap: space(3),
  },
  rowFocused: {
    backgroundColor: theme.colors.chipActive,
  },
  pressed: {
    opacity: 0.7,
  },
  text: {
    flex: 1,
    gap: space(0.5),
  },
  textWrapping: {
    minWidth: 220,
  },
  label: {
    ...theme.type.label,
  },
  description: {
    ...theme.type.caption,
    color: theme.colors.muted,
  },
  descriptionFocused: {
    color: theme.colors.chipActiveMuted,
  },
  detail: {
    ...theme.type.callout,
  },
  value: {
    color: theme.colors.muted,
    flexShrink: 1,
    textAlign: "right",
  },
  fieldRow: {
    padding: space(1),
  },
  choices: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space(1),
  },
});
