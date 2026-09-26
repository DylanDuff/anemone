//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { useRef, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { Chip } from "./Chip";
import { type ChoiceMenuProps, currentChoice } from "./choiceMenuTypes";
import { Focusable } from "./Focusable";
import { Icon } from "./Icon";
import { space, theme } from "./theme";

const MENU_MIN_WIDTH = 180;

/**
 * A chip showing the current choice that opens a menu of all of them. This is the themed version
 * (web); iOS and Android phones use their native menus (`ChoiceMenu.ios.tsx`, `.android.tsx`).
 */
export function ChoiceMenu<Value extends string>({
  choices,
  value,
  onChange,
  accessibilityLabel,
}: ChoiceMenuProps<Value>) {
  const anchor = useRef<View>(null);
  const [position, setPosition] = useState<{ top: number; left: number }>();
  const current = currentChoice(choices, value);
  if (!current) {
    return null;
  }

  const open = () =>
    anchor.current?.measureInWindow((x, y, _width, height) =>
      setPosition({ top: y + height + space(1), left: x }),
    );
  const close = () => setPosition(undefined);

  return (
    <View ref={anchor} collapsable={false}>
      <Chip
        label={current.label}
        icon={current.icon}
        accessibilityLabel={`${accessibilityLabel}: ${current.label}`}
        onPress={open}
      />
      <Modal transparent visible={position != null} onRequestClose={close} animationType="fade">
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Close menu" />
        <View style={[styles.menu, position]} accessibilityRole="menu">
          {choices.map((choice) => {
            const selected = choice.value === value;
            return (
              <Focusable
                key={choice.value}
                accessibilityRole="menuitem"
                accessibilityState={{ selected }}
                onPress={() => {
                  onChange(choice.value);
                  close();
                }}
                style={({ focused }) => [styles.item, focused ? styles.itemFocused : null]}
              >
                {({ focused }) => {
                  const color = focused ? theme.colors.chipActiveText : theme.colors.text;
                  return (
                    <>
                      <Icon name={choice.icon} size={18} color={color} />
                      <Text style={[styles.label, { color }]}>{choice.label}</Text>
                      {selected ? (
                        <Icon
                          name="checkmark"
                          size={18}
                          color={focused ? theme.colors.chipActiveText : theme.colors.accent}
                        />
                      ) : null}
                    </>
                  );
                }}
              </Focusable>
            );
          })}
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  menu: {
    position: "absolute",
    minWidth: MENU_MIN_WIDTH,
    padding: space(0.75),
    gap: space(0.25),
    borderRadius: theme.radii.lg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.panel,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(1.25),
    paddingHorizontal: space(1.5),
    paddingVertical: space(1.25),
    borderRadius: theme.radii.md,
  },
  itemFocused: {
    backgroundColor: theme.colors.chipActive,
  },
  label: {
    ...theme.type.label,
    flex: 1,
  },
});
