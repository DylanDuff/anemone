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
  Row as ComposeRow,
  Switch,
  Text,
} from "@expo/ui/jetpack-compose";
import {
  background,
  clickable,
  clip,
  fillMaxWidth,
  padding,
  Shapes,
  size,
} from "@expo/ui/jetpack-compose/modifiers";
import { type ReactNode, useState } from "react";
import { StyleSheet, View } from "react-native";
import { useContentLayout } from "../contentLayout";
import { Icon } from "../Icon";
import { space, theme } from "../theme";
import { PAGE_PADDING_BOTTOM, PageHeader } from "../PageHeader";
import {
  SETTING_ICON_FRAME,
  SETTING_ICON_SIZE,
  SETTINGS_MAX_WIDTH,
  SWATCH_GAP,
  SWATCH_RING_WIDTH,
  SWATCH_SIZE,
  SWATCH_SLOT,
} from "./layout";
import {
  type ActionSettingProps,
  type ChoiceSettingProps,
  type InfoSettingProps,
  type LinkSettingProps,
  optionLabel,
  sectionRows,
  type SettingsListProps,
  type SettingsSectionProps,
  type SwatchSettingProps,
  type TextSettingProps,
  type ToggleSettingProps,
} from "./types";
import { useAccent } from "../../settings";

const ROW_COLORS = {
  containerColor: theme.colors.surface,
  contentColor: theme.colors.text,
  supportingContentColor: theme.colors.muted,
  leadingContentColor: theme.colors.text,
  trailingContentColor: theme.colors.muted,
};


/** Material's connected-list corners: fully round at a section's ends, slightly between rows. */
const OUTER_RADIUS = 20;
const INNER_RADIUS = 4;

function rowShape(index: number, count: number) {
  const top = index === 0 ? OUTER_RADIUS : INNER_RADIUS;
  const bottom = index === count - 1 ? OUTER_RADIUS : INNER_RADIUS;
  return Shapes.RoundedCorner({ topStart: top, topEnd: top, bottomStart: bottom, bottomEnd: bottom });
}

/**
 * The whole page is one Compose list running under the navigation pill, like every other page:
 * the `PageHeader` is its first item (so it scrolls away with the content), then the sections.
 */
export function SettingsList({ title, back, children }: SettingsListProps) {
  const { insetLeft, insetRight, insetBottom } = useContentLayout();
  const accent = useAccent().color;
  return (
    <View style={styles.screen}>
      <Host
        colorScheme="dark"
        seedColor={accent}
        style={[styles.list, { marginLeft: insetLeft, marginRight: insetRight }]}
      >
        <LazyColumn
          verticalArrangement={{ spacedBy: space(3) }}
          contentPadding={{ bottom: PAGE_PADDING_BOTTOM + insetBottom }}
        >
          <RNHostView matchContents>
            {/* The list's own spacing separates it from the first section. */}
            <PageHeader title={title} back={back} style={{ marginBottom: 0 }} />
          </RNHostView>
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
  const accent = useAccent();
  return (
    <Row
      label={label}
      description={description}
      onPress={() => onChange(!value)}
      trailing={<Switch value={value} onCheckedChange={onChange} colors={{ checkedTrackColor: accent.switchTrack, checkedThumbColor: accent.onColor }} />}
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
  const accent = useAccent().color;
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
            <Text color={accent}>{optionLabel(options, value)}</Text>
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
                    <Text color={accent}>✓</Text>
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
  const accent = useAccent().color;
  return (
    <Row
      label={label}
      onPress={onPress}
      leading={
        icon ? (
          <RNHostView matchContents>
            <View style={styles.icon}>
              <Icon name={icon.icon} size={SETTING_ICON_SIZE} color={accent} />
            </View>
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
  const accent = useAccent().color;
  return (
    <Row
      label={label}
      labelColor={
        disabled ? theme.colors.muted : destructive ? theme.colors.error : accent
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
  const accent = useAccent().color;
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
          cursorColor={accent}
          textStyle={{ color: theme.colors.text }}
        />
      </ListItem.HeadlineContent>
    </ListItem>
  );
}

/** Ink wells under the label: nested circles — a white ring (chosen) or none, a gap, the colour. */
export function SwatchSetting<Value extends string>({
  label,
  description,
  options,
  value,
  onChange,
}: SwatchSettingProps<Value>) {
  const inner = SWATCH_SLOT - SWATCH_RING_WIDTH * 2;
  return (
    <ListItem colors={ROW_COLORS} modifiers={[fillMaxWidth()]}>
      <ListItem.HeadlineContent>
        <Text color={theme.colors.text}>{label}</Text>
      </ListItem.HeadlineContent>
      <ListItem.SupportingContent>
        <Column verticalArrangement={{ spacedBy: 8 }}>
          {description ? <Text color={theme.colors.muted}>{description}</Text> : null}
          <ComposeRow horizontalArrangement={{ spacedBy: SWATCH_GAP }}>
            {options.map((option) => (
              <Box
                key={option.value}
                contentAlignment="center"
                modifiers={[
                  size(SWATCH_SLOT, SWATCH_SLOT),
                  clip(Shapes.Circle),
                  background(option.value === value ? theme.colors.white : theme.colors.surface),
                  clickable(() => onChange(option.value)),
                ]}
              >
                <Box
                  contentAlignment="center"
                  modifiers={[size(inner, inner), clip(Shapes.Circle), background(theme.colors.surface)]}
                >
                  <Box
                    modifiers={[
                      size(SWATCH_SIZE, SWATCH_SIZE),
                      clip(Shapes.Circle),
                      background(option.color),
                    ]}
                  />
                </Box>
              </Box>
            ))}
          </ComposeRow>
        </Column>
      </ListItem.SupportingContent>
    </ListItem>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  icon: {
    width: SETTING_ICON_FRAME,
    alignItems: "center",
  },
  list: {
    flex: 1,
    maxWidth: SETTINGS_MAX_WIDTH,
  },
});
