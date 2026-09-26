//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { Host, Menu, RNHostView, Toggle } from "@expo/ui/swift-ui";
import { ChipFace } from "./Chip";
import { type ChoiceMenuProps, currentChoice } from "./choiceMenuTypes";

/**
 * iOS: the system pull-down menu, opened by tapping a chip showing the current choice. Choices are
 * toggles, so iOS checkmarks the current one itself.
 */
export function ChoiceMenu<Value extends string>({
  choices,
  value,
  onChange,
}: ChoiceMenuProps<Value>) {
  const current = currentChoice(choices, value);
  if (!current) {
    return null;
  }
  return (
    <Host matchContents colorScheme="dark">
      <Menu
        label={
          <RNHostView matchContents>
            <ChipFace label={current.label} icon={current.icon} />
          </RNHostView>
        }
      >
        {choices.map((choice) => (
          <Toggle
            key={choice.value}
            label={choice.label}
            systemImage={choice.systemImage}
            isOn={choice.value === value}
            onIsOnChange={() => onChange(choice.value)}
          />
        ))}
      </Menu>
    </Host>
  );
}
