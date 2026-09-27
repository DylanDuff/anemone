//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// Android phones: settings as Material 3 "connected" list rows in Jetpack Compose (the system's
// switches and dropdowns), drawn in our colours. Android TV uses the themed kit instead — Compose
// views don't join the TV focus engine.
//

import { TextInput } from "@expo/ui";
import {
  Box,
  CircularProgressIndicator,
  Column,
  DropdownMenu,
  DropdownMenuItem,
  Host,
  LazyColumn,
  ListItem,
  RNHostView,
  Switch,
  Text,
} from "@expo/ui/jetpack-compose";
import { clickable, clip, fillMaxWidth, padding, Shapes } from "@expo/ui/jetpack-compose/modifiers";
import { type ReactNode, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useContentLayout } from "../contentLayout";
import { Icon } from "../Icon";
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
  optionLabel,
  sectionRows,
  type SettingsListProps,
  type SettingsSectionProps,
  type TextSettingProps,
  type ToggleSettingProps,
} from "./types";

const ROW_COLORS = {
  containerColor: theme.colors.surface,
  contentColor: theme.colors.text,
  supportingContentColor: theme.colors.muted,
  leadingContentColor: theme.colors.text,
  trailingContentColor: theme.colors.muted,
};

const SWITCH_COLORS = {
  checkedTrackColor: theme.colors.accent,
  checkedThumbColor: theme.colors.white,
};

/** Material's connected-list corners: fully round at a section's ends, slightly between rows. */
const OUTER_RADIUS = 20;
const INNER_RADIUS = 4;

function rowShape(index: number, count: number) {
  const top = index === 0 ? OUTER_RADIUS : INNER_RADIUS;
  const bottom = index === count - 1 ? OUTER_RADIUS : INNER_RADIUS;
  return Shapes.RoundedCorner({ topStart: top, topEnd: top, bottomStart: bottom, bottomEnd: bottom });
}

/** The page header stays in React Native; the rows scroll in a Compose list beneath it. */
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
        style={[styles.list, { marginLeft: insetLeft, marginRight: insetRight }]}
      >
        <LazyColumn
          verticalArrangement={{ spacedBy: space(3) }}
          contentPadding={{ top: space(3), bottom: SETTINGS_PADDING_BOTTOM + insetBottom }}
        >
          {children}
        </LazyColumn>
      </Host>
    </View>
  );
}

export function SettingsSection({ title, footer, children }: SettingsSectionProps) {
  const rows = sectionRows(children);
  return (
    <Column verticalArrangement={{ spacedBy: 4 }} modifiers={[fillMaxWidth()]}>
      {title ? (
        <Text
          color={theme.colors.muted}
          style={{ typography: "titleSmall" }}
          modifiers={[padding(16, 0, 16, 4)]}
        >
          {title}
        </Text>
      ) : null}
      <Column verticalArrangement={{ spacedBy: 2 }} modifiers={[fillMaxWidth()]}>
        {rows.map((row, index) => (
          <Box key={index} modifiers={[fillMaxWidth(), clip(rowShape(index, rows.length))]}>
            {row}
          </Box>
        ))}
      </Column>
      {footer ? (
        <Text
          color={theme.colors.muted}
          style={{ typography: "bodySmall" }}
          modifiers={[padding(16, 4, 16, 0)]}
        >
          {footer}
        </Text>
      ) : null}
    </Column>
  );
}

/** One Material list row; pressable when given `onPress`. */
function Row({
  label,
  labelColor = theme.colors.text,
  description,
  leading,
  trailing,
  onPress,
}: {
  label: string;
  labelColor?: string;
  description?: string;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
}) {
  return (
    <ListItem
      colors={ROW_COLORS}
      modifiers={[fillMaxWidth(), ...(onPress ? [clickable(onPress)] : [])]}
    >
      <ListItem.HeadlineContent>
        <Text color={labelColor}>{label}</Text>
      </ListItem.HeadlineContent>
      {description ? (
        <ListItem.SupportingContent>
          <Text color={theme.colors.muted}>{description}</Text>
        </ListItem.SupportingContent>
      ) : null}
      {leading ? <ListItem.LeadingContent>{leading}</ListItem.LeadingContent> : null}
      {trailing ? <ListItem.TrailingContent>{trailing}</ListItem.TrailingContent> : null}
    </ListItem>
  );
}

export function ToggleSetting({ label, description, value, onChange }: ToggleSettingProps) {
  return (
    <Row
      label={label}
      description={description}
      onPress={() => onChange(!value)}
      trailing={<Switch value={value} onCheckedChange={onChange} colors={SWITCH_COLORS} />}
    />
  );
}

/** The current choice on the trailing edge; the row opens a Material dropdown of all of them. */
export function ChoiceSetting<Value extends string>({
  label,
  description,
  options,
  value,
  onChange,
}: ChoiceSettingProps<Value>) {
  const [open, setOpen] = useState(false);
  return (
    <Row
      label={label}
      description={description}
      onPress={() => setOpen(true)}
      trailing={
        <DropdownMenu
          expanded={open}
          onDismissRequest={() => setOpen(false)}
          color={theme.colors.surface}
        >
          <DropdownMenu.Trigger>
            <Text color={theme.colors.accent}>{optionLabel(options, value)}</Text>
          </DropdownMenu.Trigger>
          <DropdownMenu.Items>
            {options.map((option) => (
              <DropdownMenuItem
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
              >
                <DropdownMenuItem.Text>
                  <Text color={theme.colors.text}>{option.label}</Text>
                </DropdownMenuItem.Text>
                {option.value === value ? (
                  <DropdownMenuItem.TrailingIcon>
                    <Text color={theme.colors.accent}>✓</Text>
                  </DropdownMenuItem.TrailingIcon>
                ) : null}
              </DropdownMenuItem>
            ))}
          </DropdownMenu.Items>
        </DropdownMenu>
      }
    />
  );
}

export function LinkSetting({ label, icon, detail, onPress }: LinkSettingProps) {
  return (
    <Row
      label={label}
      onPress={onPress}
      leading={
        icon ? (
          <RNHostView matchContents>
            <Icon name={icon.icon} color={theme.colors.accent} />
          </RNHostView>
        ) : undefined
      }
      trailing={detail ? <Text color={theme.colors.muted}>{detail}</Text> : undefined}
    />
  );
}

export function InfoSetting({ label, description, value }: InfoSettingProps) {
  return (
    <Row
      label={label}
      description={description}
      trailing={value ? <Text color={theme.colors.muted}>{value}</Text> : undefined}
    />
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
    <Row
      label={label}
      labelColor={
        disabled ? theme.colors.muted : destructive ? theme.colors.error : theme.colors.accent
      }
      onPress={busy || disabled ? undefined : onPress}
      trailing={busy ? <CircularProgressIndicator color={theme.colors.muted} /> : undefined}
    />
  );
}

/** A Compose text field filling the row's headline. */
export function TextSetting({
  label,
  defaultValue,
  onChangeText,
  secureTextEntry,
  autoCapitalize,
}: TextSettingProps) {
  return (
    <ListItem colors={ROW_COLORS} modifiers={[fillMaxWidth()]}>
      <ListItem.HeadlineContent>
        <TextInput
          placeholder={label}
          defaultValue={defaultValue}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize}
          autoCorrect={false}
          placeholderTextColor={theme.colors.muted}
          cursorColor={theme.colors.accent}
          textStyle={{ color: theme.colors.text }}
        />
      </ListItem.HeadlineContent>
    </ListItem>
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
  list: {
    flex: 1,
    maxWidth: SETTINGS_MAX_WIDTH,
  },
});
