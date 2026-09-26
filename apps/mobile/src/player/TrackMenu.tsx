//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { type PlaybackSource, SUBTITLES_OFF, type TrackChange } from "@anemone/core";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { Focusable } from "../ui/Focusable";
import { Icon } from "../ui/Icon";
import { space, theme } from "../ui/theme";
import { FocusGuide, useHardwareBack } from "../ui/tv";

/**
 * Audio and subtitle choices, in a panel over the right of the video. Focus stays inside it on TV;
 * Back, or pressing outside it, closes it.
 */
export function TrackMenu({
  source,
  onSelect,
  onClose,
}: {
  source: PlaybackSource;
  onSelect: (change: TrackChange) => void;
  onClose: () => void;
}) {
  useHardwareBack(true, onClose);
  const subtitleOptions = [
    { index: SUBTITLES_OFF, title: "Off" },
    ...source.subtitleTracks,
  ];

  return (
    <View style={StyleSheet.absoluteFill}>
      <Focusable
        focusable={false}
        accessibilityLabel="Close track menu"
        onPress={onClose}
        style={StyleSheet.absoluteFill}
      />
      <FocusGuide autoFocus trapFocusUp trapFocusDown trapFocusLeft trapFocusRight style={styles.panel}>
        <ScrollView contentContainerStyle={styles.content}>
          {source.audioTracks.length > 0 ? (
            <TrackSection
              title="Audio"
              options={source.audioTracks}
              selectedIndex={source.audioStreamIndex}
              onSelect={(index) => onSelect({ kind: "audio", index })}
              preferFocus
            />
          ) : null}
          <TrackSection
            title="Subtitles"
            options={subtitleOptions}
            selectedIndex={source.subtitleStreamIndex}
            onSelect={(index) => onSelect({ kind: "subtitle", index })}
            preferFocus={source.audioTracks.length === 0}
          />
        </ScrollView>
      </FocusGuide>
    </View>
  );
}

function TrackSection({
  title,
  options,
  selectedIndex,
  onSelect,
  preferFocus,
}: {
  title: string;
  options: ReadonlyArray<{ index: number; title: string }>;
  selectedIndex: number | undefined;
  onSelect: (index: number) => void;
  preferFocus: boolean;
}) {
  return (
    <View style={styles.section}>
      <Text style={styles.heading}>{title}</Text>
      {options.map((option) => {
        const selected = option.index === selectedIndex;
        return (
          <Focusable
            key={option.index}
            accessibilityRole="radio"
            accessibilityState={{ selected }}
            hasTVPreferredFocus={preferFocus && selected}
            onPress={() => onSelect(option.index)}
            style={({ focused, pressed }) => [
              styles.option,
              focused ? styles.optionFocused : null,
              pressed ? styles.pressed : null,
            ]}
          >
            {({ focused }) => (
              <>
                <Text
                  numberOfLines={1}
                  style={[styles.optionLabel, focused ? styles.optionLabelFocused : null]}
                >
                  {option.title}
                </Text>
                {selected ? (
                  <Icon
                    name="checkmark"
                    size={18}
                    color={focused ? theme.colors.chipActiveText : theme.colors.text}
                  />
                ) : null}
              </>
            )}
          </Focusable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    position: "absolute",
    top: space(2),
    right: space(2),
    bottom: space(2),
    width: 340,
    maxWidth: "85%",
    borderRadius: theme.radius,
    backgroundColor: "rgba(23,23,29,0.94)",
    overflow: "hidden",
  },
  content: {
    padding: space(2),
    gap: space(3),
  },
  section: {
    gap: space(0.5),
  },
  heading: {
    color: theme.colors.muted,
    fontSize: 13,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: space(0.5),
  },
  option: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: space(1),
    paddingHorizontal: space(1.5),
    paddingVertical: space(1.25),
    borderRadius: 10,
  },
  optionFocused: {
    backgroundColor: theme.colors.chipActive,
  },
  pressed: {
    opacity: 0.7,
  },
  optionLabel: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 15,
  },
  optionLabelFocused: {
    color: theme.colors.chipActiveText,
  },
});
