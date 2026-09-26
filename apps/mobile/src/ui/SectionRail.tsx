//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { Fragment, useEffect, useRef, useState } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import type { Section } from "../navigation/routes";
import type { SectionEntry } from "../navigation/sections";
import { Focusable, FocusWithin } from "./Focusable";
import { GlassSurface } from "./Glass";
import { Icon, iconVariant } from "./Icon";
import { space, theme } from "./theme";
import { FocusGuide, isTV, type RemoteEvent, useHardwareBack, useRemoteEvents } from "./tv";

const RAIL_MARGIN = space(2);
const RAIL_COLLAPSED_WIDTH = 64;
const RAIL_EXPANDED_WIDTH = 220;
const ITEM_SIZE = 48;
const RAIL_PADDING = (RAIL_COLLAPSED_WIDTH - ITEM_SIZE) / 2;

/**
 * Where page content should start so it clears the collapsed rail (margin + pill + breathing room).
 * Content scrolls underneath the pill; hero artwork ignores this and bleeds beneath it.
 */
/**
 * On TV the pill rests smaller and grows to full size while it has focus, so it takes little room
 * while you browse. A transform (not a relayout), anchored at its left edge.
 */
const TV_REST_SCALE = 0.8;
const REST_SCALE = isTV ? TV_REST_SCALE : 1;
const SCALE_DURATION_MS = 180;

export const RAIL_CONTENT_INSET = RAIL_MARGIN + RAIL_COLLAPSED_WIDTH * REST_SCALE + space(3);

/**
 * The section switcher on wide screens (TV, web, tablets): a floating glass pill of icons,
 * vertically centred over the page's left edge. It widens to show labels while it has D-pad focus
 * (TV) or the pointer (web). Selecting a section swaps the content; on TV, moving focus alone
 * doesn't switch — press Select.
 */
export function SectionRail({
  entries,
  onSelect,
  onDismiss,
}: {
  entries: readonly SectionEntry[];
  onSelect: (section: Section) => void;
  /** Return focus to the page (Back while the rail is focused). */
  onDismiss: () => void;
}) {
  const [focusedWithin, setFocusedWithin] = useState(false);
  const [hovered, setHovered] = useState(false);
  // On web, clicking a section also focuses it; that focus shouldn't hold the pill open once the
  // pointer leaves. Only keyboard / D-pad focus expands it.
  const pointerFocus = useRef(false);
  const expanded = hovered || (focusedWithin && !pointerFocus.current);

  const scale = useRef(new Animated.Value(REST_SCALE)).current;
  useEffect(() => {
    if (!isTV) {
      return;
    }
    const animation = Animated.timing(scale, {
      toValue: focusedWithin ? 1 : REST_SCALE,
      duration: SCALE_DURATION_MS,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [focusedWithin, scale]);

  // Back — or Right, the direction of the page — while the rail has focus closes it and returns to
  // where you were, rather than navigating back / jumping to whatever is geometrically nearest.
  useHardwareBack(focusedWithin, onDismiss);
  const focusedWithinRef = useRef(false);
  focusedWithinRef.current = focusedWithin;
  useRemoteEvents((event: RemoteEvent) => {
    if (focusedWithinRef.current && event.eventType === "right") {
      onDismiss();
    }
  });

  return (
    // Full-height, touch-transparent column that just centres the pill.
    <View style={styles.anchor}>
      <Animated.View
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={() => {
          pointerFocus.current = true;
        }}
        style={[styles.pillShadow, { transform: [{ scale }] }]}
      >
        <GlassSurface
          style={[
            styles.pill,
            { width: expanded ? RAIL_EXPANDED_WIDTH : RAIL_COLLAPSED_WIDTH },
          ]}
        >
          {/* Right is trapped so only `onDismiss` handles it (see above). */}
          <FocusGuide autoFocus trapFocusRight style={styles.items}>
            <FocusWithin
              onFocusChange={(within) => {
                if (!within) {
                  pointerFocus.current = false;
                }
                setFocusedWithin(within);
              }}
            >
              {entries.map((entry) => (
                <Fragment key={entry.key}>
                  {entry.separated ? <View style={styles.separator} /> : null}
                  <Focusable
                    onPress={() => onSelect(entry.section)}
                    accessibilityRole="button"
                    accessibilityLabel={entry.label}
                    accessibilityState={{ selected: entry.active }}
                    style={({ focused }) => [
                      styles.item,
                      entry.active ? styles.itemActive : null,
                      focused ? styles.itemFocused : null,
                    ]}
                  >
                    {({ focused }) => (
                      <>
                        <View style={styles.glyphCell}>
                          <Icon
                            name={iconVariant(entry.icon, entry.active)}
                            size={22}
                            color={focused ? theme.colors.chipActiveText : theme.colors.text}
                          />
                        </View>
                        {expanded ? (
                          <Text
                            numberOfLines={1}
                            style={[
                              styles.label,
                              entry.active ? styles.labelActive : null,
                              focused ? styles.labelFocused : null,
                            ]}
                          >
                            {entry.label}
                          </Text>
                        ) : null}
                      </>
                    )}
                  </Focusable>
                </Fragment>
              ))}
            </FocusWithin>
          </FocusGuide>
        </GlassSurface>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    top: 0,
    bottom: 0,
    left: RAIL_MARGIN,
    justifyContent: "center",
    zIndex: 10,
    // Only the pill takes touches; the rest of the column passes them to the page.
    pointerEvents: "box-none",
  },
  pillShadow: {
    // Scale from the left edge so the pill grows out of its margin rather than drifting.
    transformOrigin: "left center",
    borderRadius: RAIL_COLLAPSED_WIDTH / 2,
    shadowColor: "#000",
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  pill: {
    borderRadius: RAIL_COLLAPSED_WIDTH / 2,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255,255,255,0.14)",
    paddingVertical: RAIL_PADDING,
  },
  items: {
    gap: space(0.75),
    paddingHorizontal: RAIL_PADDING,
  },
  // Sets utility entries (Settings) apart from the content sections.
  separator: {
    height: StyleSheet.hairlineWidth,
    marginVertical: space(0.75),
    marginHorizontal: space(1),
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    height: ITEM_SIZE,
    borderRadius: ITEM_SIZE / 2,
  },
  itemActive: {
    backgroundColor: theme.colors.accent,
  },
  itemFocused: {
    backgroundColor: theme.colors.chipActive,
  },
  glyphCell: {
    width: ITEM_SIZE,
    alignItems: "center",
  },
  label: {
    flex: 1,
    paddingRight: space(2),
    color: theme.colors.muted,
    fontSize: 15,
    fontWeight: "500",
  },
  labelActive: {
    color: theme.colors.text,
  },
  labelFocused: {
    color: theme.colors.chipActiveText,
  },
});
