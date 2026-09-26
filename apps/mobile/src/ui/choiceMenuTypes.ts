//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { ToggleProps } from "@expo/ui/swift-ui";
import type { IconName } from "./Icon";

/** One option of a `ChoiceMenu`. */
export interface MenuChoice<Value extends string> {
  readonly value: Value;
  readonly label: string;
  /** Shown on the chip and in the themed menu. */
  readonly icon: IconName;
  /** The same icon as an SF Symbol, for the native iOS menu. */
  readonly systemImage: NonNullable<ToggleProps["systemImage"]>;
}

export interface ChoiceMenuProps<Value extends string> {
  readonly choices: readonly MenuChoice<Value>[];
  readonly value: Value;
  readonly onChange: (value: Value) => void;
  /** What the menu picks (e.g. "Layout"), for screen readers. */
  readonly accessibilityLabel: string;
}

/** The choice matching `value`, falling back to the first. */
export function currentChoice<Value extends string>(
  choices: readonly MenuChoice<Value>[],
  value: Value,
): MenuChoice<Value> | undefined {
  return choices.find((choice) => choice.value === value) ?? choices[0];
}
