//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { ImageProps } from "@expo/ui/swift-ui";
import { Children, Fragment, isValidElement, type ReactElement, type ReactNode } from "react";
import type { IconName } from "../Icon";

/** A row's icon: Ionicons for the themed and Android rows, the same glyph as an SF Symbol on iOS. */
export interface SettingIcon {
  readonly icon: IconName;
  readonly systemImage: NonNullable<ImageProps["systemName"]>;
}

export interface SettingsListProps {
  /** The page title, also used as the document title on web. */
  readonly title: string;
  /** Show a Back button (sub-pages; hidden on TV, where the remote's Back does it). */
  readonly back?: boolean;
  /** `SettingsSection`s. */
  readonly children: ReactNode;
}

export interface SettingsSectionProps {
  readonly title?: string;
  /** A note under the section's rows. */
  readonly footer?: string;
  /** Setting rows; `null`/`false` children (conditional rows) are skipped. */
  readonly children: ReactNode;
}

export interface ToggleSettingProps {
  readonly label: string;
  readonly description?: string;
  readonly value: boolean;
  readonly onChange: (value: boolean) => void;
}

export interface SettingOption<Value extends string> {
  readonly value: Value;
  readonly label: string;
}

export interface ChoiceSettingProps<Value extends string> {
  readonly label: string;
  readonly description?: string;
  readonly options: readonly SettingOption<Value>[];
  readonly value: Value;
  readonly onChange: (value: Value) => void;
}

/** A row that opens another page. */
export interface LinkSettingProps {
  readonly label: string;
  readonly icon?: SettingIcon;
  /** The current value, shown before the chevron (e.g. "Left"). */
  readonly detail?: string;
  readonly onPress: () => void;
}

/** A read-only row: a label, optional subtitle, and a value on the trailing edge. */
export interface InfoSettingProps {
  readonly label: string;
  readonly description?: string;
  readonly value?: string;
}

/** A row that does something when pressed (Sign Out). */
export interface ActionSettingProps {
  readonly label: string;
  readonly onPress: () => void;
  readonly destructive?: boolean;
  /** Ignores presses and shows progress while the action runs. */
  readonly busy?: boolean;
  /** Dimmed and ignores presses (e.g. Save before anything has changed). */
  readonly disabled?: boolean;
  /** Take D-pad focus when the row appears (TV), e.g. the confirm step of a destructive action. */
  readonly preferFocus?: boolean;
}

/**
 * A single-line text field row, uncontrolled: it starts at `defaultValue` and reports edits.
 * `label` is its placeholder, so put it in a titled section when the value hides it.
 */
export interface TextSettingProps {
  readonly label: string;
  readonly defaultValue?: string;
  readonly onChangeText: (text: string) => void;
  readonly secureTextEntry?: boolean;
  readonly autoCapitalize?: "none" | "sentences" | "words" | "characters";
}

/**
 * One implementation of the settings components. Screens import them from `ui/settings`, which
 * picks the native kit (SwiftUI `Form` / Compose list) or the themed one by `nativeControls`.
 */
export interface SettingsKit {
  readonly SettingsList: (props: SettingsListProps) => ReactElement;
  readonly SettingsSection: (props: SettingsSectionProps) => ReactElement;
  readonly ToggleSetting: (props: ToggleSettingProps) => ReactElement;
  readonly ChoiceSetting: <Value extends string>(props: ChoiceSettingProps<Value>) => ReactElement;
  readonly LinkSetting: (props: LinkSettingProps) => ReactElement;
  readonly InfoSetting: (props: InfoSettingProps) => ReactElement;
  readonly ActionSetting: (props: ActionSettingProps) => ReactElement;
  readonly TextSetting: (props: TextSettingProps) => ReactElement;
}

/** The label of the option matching `value`. */
export function optionLabel<Value extends string>(
  options: readonly SettingOption<Value>[],
  value: Value,
): string {
  return options.find((option) => option.value === value)?.label ?? "";
}

/** A section's rows: its children with conditional gaps dropped and fragments flattened. */
export function sectionRows(children: ReactNode): ReactNode[] {
  return Children.toArray(children).flatMap((child) =>
    isValidElement<{ children?: ReactNode }>(child) && child.type === Fragment
      ? sectionRows(child.props.children)
      : [child],
  );
}
