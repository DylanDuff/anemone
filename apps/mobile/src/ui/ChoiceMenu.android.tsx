//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { DropdownMenu, DropdownMenuItem, Host, RNHostView, Text } from "@expo/ui/jetpack-compose";
import { useState } from "react";
import { Chip } from "./Chip";
import { type ChoiceMenuProps, currentChoice } from "./choiceMenuTypes";
import { theme } from "./theme";

/**
 * Android phones: a Material dropdown opened from a chip showing the current choice, with a check
 * beside the current one.
 */
export function ChoiceMenu<Value extends string>({
  choices,
  value,
  onChange,
  accessibilityLabel,
  glass,
}: ChoiceMenuProps<Value>) {
  const [open, setOpen] = useState(false);
  const current = currentChoice(choices, value);
  if (!current) {
    return null;
  }
  return (
    <Host matchContents colorScheme="dark">
      <DropdownMenu
        expanded={open}
        onDismissRequest={() => setOpen(false)}
        color={theme.colors.surface}
      >
        <DropdownMenu.Trigger>
          <RNHostView matchContents>
            <Chip
              label={current.label}
              icon={current.icon}
              glass={glass}
              accessibilityLabel={`${accessibilityLabel}: ${current.label}`}
              onPress={() => setOpen(true)}
            />
          </RNHostView>
        </DropdownMenu.Trigger>
        <DropdownMenu.Items>
          {choices.map((choice) => (
            <DropdownMenuItem
              key={choice.value}
              onClick={() => {
                onChange(choice.value);
                setOpen(false);
              }}
            >
              <DropdownMenuItem.Text>
                <Text color={theme.colors.text}>{choice.label}</Text>
              </DropdownMenuItem.Text>
              {choice.value === value ? (
                <DropdownMenuItem.TrailingIcon>
                  <Text color={theme.colors.accent}>✓</Text>
                </DropdownMenuItem.TrailingIcon>
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenu.Items>
      </DropdownMenu>
    </Host>
  );
}
