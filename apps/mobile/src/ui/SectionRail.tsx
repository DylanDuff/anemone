//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import type { NavigationPlacement } from "@anemone/core";
import { Fragment, useEffect, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import { type EdgeInsets, useSafeAreaInsets } from "react-native-safe-area-context";
import type { Section } from "../navigation/routes";
import type { SectionEntry } from "../navigation/sections";
import { type ContentLayout, gutterFor } from "./contentLayout";
import { Focusable, focusLift, FocusWithin } from "./Focusable";
import { GlassSurface } from "./Glass";
import { Icon, iconVariant } from "./Icon";
import { space, theme } from "./theme";
import { FocusGuide, isTV, type RemoteEvent, useHardwareBack, useRemoteEvents } from "./tv";

const RAIL_MARGIN = space(2);
/** Phones: the least room left below the pill (screens without a home indicator). */
const COMPACT_MARGIN = space(1);
/** Phones: how far the pill sinks into the bottom safe area — the home indicator sits well below. */
const COMPACT_SAFE_AREA_TUCK = space(1);
const RAIL_COLLAPSED_WIDTH = 64;
const RAIL_EXPANDED_WIDTH = 220;
const ITEM_SIZE = 48;
const RAIL_PADDING = (RAIL_COLLAPSED_WIDTH - ITEM_SIZE) / 2;
/** Horizontal pill items: icon over label. */
const LABELLED_ITEM_HEIGHT = 56;
/** Phones: a smaller, icon-only pill. */
const COMPACT_ITEM_SIZE = 46;
const COMPACT_PADDING = 7;
const ICON_SIZE = 22;
/**
 * Phones: while the page is scrolled down the pill shrinks to this thickness (40pt items, 6pt
 * padding), as iOS tab bars minimise. A transform, anchored at its bottom edge.
 */
const COMPACT_MINIMIZED_THICKNESS = 52;
const COMPACT_MINIMIZED_SCALE = COMPACT_MINIMIZED_THICKNESS / (COMPACT_ITEM_SIZE + COMPACT_PADDING * 2);

/**
 * On TV the pill rests smaller and grows to full size while it has focus, so it takes little room
 * while you browse. A transform (not a relayout), anchored at the edge it floats along.
 */
const TV_REST_SCALE = 0.8;
const REST_SCALE = isTV ? TV_REST_SCALE : 1;
const SCALE_DURATION_MS = 180;

/** Breathing room between a side pill and the content beside it. */
const SIDE_CONTENT_GAP = space(3);

/** Per placement: the D-pad direction back towards the page, and where the TV scale anchors. */
const EDGE = {
  left: { towardPage: "right", transformOrigin: "left center" },
  right: { towardPage: "left", transformOrigin: "right center" },
  top: { towardPage: "down", transformOrigin: "center top" },
  bottom: { towardPage: "up", transformOrigin: "center bottom" },
} as const satisfies Record<NavigationPlacement, object>;

const TRAP_TOWARD_PAGE = {
  right: { trapFocusRight: true },
  left: { trapFocusLeft: true },
  down: { trapFocusDown: true },
  up: { trapFocusUp: true },
} as const;

/** How the pill is drawn. The browse shell resolves it from Settings and the screen size. */
export interface PillForm {
  readonly placement: NavigationPlacement;
  /** Phones: a smaller, icon-only pill. */
  readonly compact: boolean;
  /** Labels under the icons of a top/bottom pill (the side pill shows them only when expanded). */
  readonly labels: boolean;
}

function isVertical(placement: NavigationPlacement): boolean {
  return placement === "left" || placement === "right";
}

/** Whether a top/bottom pill shows labels under its icons. */
function hasUnderLabels({ placement, compact, labels }: PillForm): boolean {
  return !isVertical(placement) && !compact && labels;
}

/**
 * The pill's collapsed size across the edge it floats along (its width on the side, height on
 * top/bottom), before the TV rest scale.
 */
function pillThickness(form: PillForm): number {
  if (form.compact) {
    return COMPACT_ITEM_SIZE + COMPACT_PADDING * 2;
  }
  if (isVertical(form.placement)) {
    return RAIL_COLLAPSED_WIDTH;
  }
  return (hasUnderLabels(form) ? LABELLED_ITEM_HEIGHT : ITEM_SIZE) + RAIL_PADDING * 2;
}

/**
 * Distance from the window edge to the pill: the safe area plus a margin. Phones sit lower, tucked
 * a little into the safe area like a native tab bar.
 */
function edgeOffset({ placement, compact }: PillForm, safeArea: EdgeInsets): number {
  if (compact) {
    return Math.max(safeArea[placement] - COMPACT_SAFE_AREA_TUCK, COMPACT_MARGIN);
  }
  return safeArea[placement] + RAIL_MARGIN;
}

/**
 * The page insets that clear the pill. Content scrolls underneath it; hero artwork ignores these
 * and bleeds beneath it. Side pills push that side's gutter past the pill; top/bottom pills keep
 * the standard gutter and reserve room above/below instead.
 */
export function usePillContentInsets(form: PillForm): Omit<ContentLayout, "width"> {
  const safeArea = useSafeAreaInsets();
  const extent = edgeOffset(form, safeArea) + pillThickness(form) * REST_SCALE;
  const gutter = gutterFor(form.compact);
  const insets = { insetLeft: gutter, insetRight: gutter, insetTop: 0, insetBottom: 0 };
  switch (form.placement) {
    case "left":
      return { ...insets, insetLeft: extent + SIDE_CONTENT_GAP };
    case "right":
      return { ...insets, insetRight: extent + SIDE_CONTENT_GAP };
    case "top":
      return { ...insets, insetTop: extent };
    case "bottom":
      return { ...insets, insetBottom: extent };
  }
}

/**
 * The section switcher: a floating glass pill of icons along one edge of the page. On the side it's
 * vertical and widens to show labels while it has D-pad focus (TV) or the pointer (web); along the
 * top/bottom it's horizontal, optionally with labels under the icons (it never expands), and
 * scrolls if the sections don't fit. `compact` (phones) is a smaller, icon-only pill. Selecting a
 * section swaps the content; on TV, moving focus alone doesn't switch — press Select.
 */
export function SectionRail({
  entries,
  form,
  minimized = false,
  onSelect,
  onDismiss,
}: {
  entries: readonly SectionEntry[];
  form: PillForm;
  /** Shrink while the page scrolls (phones; see `useScrollMinimize`). */
  minimized?: boolean;
  onSelect: (section: Section) => void;
  /** Return focus to the page (Back, or the direction of the page, while the pill is focused). */
  onDismiss: () => void;
}) {
  const { placement, compact } = form;
  const { width } = useWindowDimensions();
  const safeArea = useSafeAreaInsets();
  const vertical = isVertical(placement);
  const edge = EDGE[placement];

  const [focusedWithin, setFocusedWithin] = useState(false);
  const [hovered, setHovered] = useState(false);
  // On web, clicking a section also focuses it; that focus shouldn't hold the pill open once the
  // pointer leaves. Only keyboard / D-pad focus expands it.
  const pointerFocus = useRef(false);
  // Only the side pill expands.
  const expanded = vertical && (hovered || (focusedWithin && !pointerFocus.current));
  const labelledUnder = hasUnderLabels(form);
  const labelled = expanded || labelledUnder;

  // TV: rests small, full size with focus. Phones: minimised while the page scrolls down.
  const targetScale = isTV
    ? focusedWithin
      ? 1
      : REST_SCALE
    : compact && minimized
      ? COMPACT_MINIMIZED_SCALE
      : 1;
  const scale = useRef(new Animated.Value(targetScale)).current;
  useEffect(() => {
    const animation = Animated.timing(scale, {
      toValue: targetScale,
      duration: SCALE_DURATION_MS,
      useNativeDriver: true,
    });
    animation.start();
    return () => animation.stop();
  }, [targetScale, scale]);

  // Back — or the direction of the page — while the pill has focus closes it and returns to where
  // you were, rather than navigating back / jumping to whatever is geometrically nearest.
  useHardwareBack(focusedWithin, onDismiss);
  const focusedWithinRef = useRef(false);
  focusedWithinRef.current = focusedWithin;
  useRemoteEvents((event: RemoteEvent) => {
    if (focusedWithinRef.current && event.eventType === edge.towardPage) {
      onDismiss();
    }
  });

  const offset = edgeOffset(form, safeArea);
  const margin = compact ? COMPACT_MARGIN : RAIL_MARGIN;
  const itemSize = compact ? COMPACT_ITEM_SIZE : ITEM_SIZE;
  const itemHeight = labelledUnder ? LABELLED_ITEM_HEIGHT : itemSize;
  const pillRadius = pillThickness(form) / 2;

  const items = entries.map((entry) => (
    <Fragment key={entry.key}>
      {entry.separated ? (
        <View style={vertical ? styles.separatorAcross : styles.separatorDown} />
      ) : null}
      <Focusable
        onPress={() => onSelect(entry.section)}
        accessibilityRole="button"
        accessibilityLabel={entry.label}
        accessibilityState={{ selected: entry.active }}
        style={({ focused }) => [
          styles.item,
          { minWidth: itemSize, height: itemHeight, borderRadius: itemHeight / 2 },
          vertical ? styles.sideItem : null,
          placement === "right" ? styles.sideItemReversed : null,
          labelledUnder ? styles.labelledItem : null,
          focused ? [styles.itemFocused, focusLift] : null,
          entry.active ? styles.itemActive : null,
        ]}
      >
        {({ focused }) => (
          <>
            <View style={vertical ? styles.glyphCell : null}>
              <Icon
                name={iconVariant(entry.icon, entry.active)}
                size={ICON_SIZE}
                color={
                  entry.active
                    ? theme.colors.accent
                    : focused
                      ? theme.colors.chipActiveText
                      : theme.colors.text
                }
              />
            </View>
            {labelled ? (
              <Text
                numberOfLines={1}
                style={[
                  vertical ? styles.sideLabel : styles.underLabel,
                  placement === "right" ? styles.sideLabelReversed : null,
                  focused ? styles.labelFocused : null,
                  entry.active ? styles.labelActive : null,
                ]}
              >
                {entry.label}
              </Text>
            ) : null}
          </>
        )}
      </Focusable>
    </Fragment>
  ));

  return (
    // A touch-transparent band along the edge that just centres the pill.
    <View style={[styles.anchor, anchorStyle(placement, offset)]}>
      <Animated.View
        onPointerEnter={() => setHovered(true)}
        onPointerLeave={() => setHovered(false)}
        onPointerDown={() => {
          pointerFocus.current = true;
        }}
        style={[
          styles.pillShadow,
          { borderRadius: pillRadius, transformOrigin: edge.transformOrigin, transform: [{ scale }] },
        ]}
      >
        <GlassSurface
          tintInDarkMode
          style={[
            styles.pill,
            { borderRadius: pillRadius },
            vertical
              ? [styles.pillVertical, { width: expanded ? RAIL_EXPANDED_WIDTH : RAIL_COLLAPSED_WIDTH }]
              : { maxWidth: width - safeArea.left - safeArea.right - margin * 2 },
          ]}
        >
          {/* The page's direction is trapped so only `onDismiss` handles it (see above). */}
          <FocusGuide
            autoFocus
            {...TRAP_TOWARD_PAGE[edge.towardPage]}
            style={vertical ? styles.itemsColumn : undefined}
          >
            <FocusWithin
              onFocusChange={(within) => {
                if (!within) {
                  pointerFocus.current = false;
                }
                setFocusedWithin(within);
              }}
            >
              {vertical ? (
                items
              ) : (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.rowScroll}
                  contentContainerStyle={[
                    styles.itemsRow,
                    { padding: compact ? COMPACT_PADDING : RAIL_PADDING },
                  ]}
                >
                  {items}
                </ScrollView>
              )}
            </FocusWithin>
          </FocusGuide>
        </GlassSurface>
      </Animated.View>
    </View>
  );
}

/** Pins the anchor band along `placement`'s edge, `offset` in from it. */
function anchorStyle(placement: NavigationPlacement, offset: number) {
  switch (placement) {
    case "left":
      return { top: 0, bottom: 0, left: offset, justifyContent: "center" } as const;
    case "right":
      return { top: 0, bottom: 0, right: offset, justifyContent: "center" } as const;
    case "top":
      return { left: 0, right: 0, top: offset, alignItems: "center" } as const;
    case "bottom":
      return { left: 0, right: 0, bottom: offset, alignItems: "center" } as const;
  }
}

const styles = StyleSheet.create({
  anchor: {
    position: "absolute",
    zIndex: 10,
    // Only the pill takes touches; the rest of the band passes them to the page.
    pointerEvents: "box-none",
  },
  pillShadow: {
    shadowColor: theme.colors.black,
    shadowOpacity: 0.45,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },
  pill: {
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: theme.colors.border,
  },
  pillVertical: {
    paddingVertical: RAIL_PADDING,
  },
  itemsColumn: {
    gap: space(0.75),
    paddingHorizontal: RAIL_PADDING,
  },
  rowScroll: {
    flexGrow: 0,
  },
  itemsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: space(0.75),
  },
  // Sets utility entries (Settings) apart from the content sections.
  separatorAcross: {
    height: StyleSheet.hairlineWidth,
    marginVertical: space(0.75),
    marginHorizontal: space(1),
    backgroundColor: theme.colors.separator,
  },
  separatorDown: {
    width: StyleSheet.hairlineWidth,
    alignSelf: "stretch",
    marginVertical: space(1),
    marginHorizontal: space(0.25),
    backgroundColor: theme.colors.separator,
  },
  item: {
    alignItems: "center",
    justifyContent: "center",
  },
  sideItem: {
    flexDirection: "row",
    justifyContent: "flex-start",
  },
  // On the right the icon stays against the edge and the label opens towards the page.
  sideItemReversed: {
    flexDirection: "row-reverse",
  },
  labelledItem: {
    minWidth: 72,
    paddingHorizontal: space(1.5),
    gap: space(0.25),
  },
  glyphCell: {
    width: ITEM_SIZE,
    alignItems: "center",
  },
  // The current section: a white pill with an accent icon (and label).
  itemActive: {
    backgroundColor: theme.colors.white,
  },
  itemFocused: {
    backgroundColor: theme.colors.chipActive,
  },
  sideLabel: {
    ...theme.type.body,
    flex: 1,
    paddingRight: space(2),
    color: theme.colors.muted,
    fontWeight: theme.weight.medium,
  },
  sideLabelReversed: {
    paddingRight: 0,
    paddingLeft: space(2),
    textAlign: "right",
  },
  underLabel: {
    ...theme.type.micro,
    color: theme.colors.muted,
  },
  labelActive: {
    color: theme.colors.accent,
  },
  labelFocused: {
    color: theme.colors.chipActiveText,
  },
});
