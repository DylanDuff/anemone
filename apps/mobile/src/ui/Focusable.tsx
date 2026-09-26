//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { createContext, type ReactNode, useCallback, useContext, useMemo, useRef } from "react";
import {
  Platform,
  Pressable,
  type PressableProps,
  type StyleProp,
  StyleSheet,
  View,
  type ViewStyle,
} from "react-native";
import type { FocusIndicator } from "@anemone/core";
import { useFocusIndicatorSetting } from "../settings";
import { GradientScrim } from "./GradientScrim";
import { theme } from "./theme";

/**
 * Interaction state for styling. `focused` means "highlighted": D-pad focus on TV; on web, pointer
 * hover or keyboard focus — but not the focus a click leaves behind (see `Focusable`). Stock React
 * Native typings only declare `pressed`, hence this wrapper.
 */
export interface InteractionState {
  readonly pressed: boolean;
  readonly focused: boolean;
}

type StateStyle = StyleProp<ViewStyle> | ((state: InteractionState) => StyleProp<ViewStyle>);

export type FocusableProps = Omit<PressableProps, "style" | "children"> & {
  style?: StateStyle;
  children?: ReactNode | ((state: InteractionState) => ReactNode);
};

/**
 * The single pressable used for every interactive element, so focus behaves and reads the same
 * everywhere. It reports focus to an enclosing `FocusWithin` (e.g. the TV hero pauses auto-advance
 * while any of its buttons is focused).
 */
export function Focusable({
  style,
  children,
  onFocus,
  onBlur,
  onPointerDown,
  ...props
}: FocusableProps) {
  const focusWithin = useContext(FocusWithinContext);
  // Web: a click also focuses the element, which would leave its highlight on after the pointer
  // moves away. Remember pointer-initiated focus and don't highlight for it.
  const pointerFocus = useRef(false);

  const resolve = <Value,>(value: Value | ((state: InteractionState) => Value)) =>
    typeof value === "function"
      ? (state: unknown) =>
          (value as (state: InteractionState) => Value)(highlightState(state, pointerFocus.current))
      : value;
  const resolvedStyle = resolve(style);
  // Ease every highlight change on web (see `hoverTransition`).
  const styleWithTransition =
    typeof resolvedStyle === "function"
      ? (state: unknown) => [hoverTransition, resolvedStyle(state)]
      : [hoverTransition, resolvedStyle];

  return (
    <Pressable
      {...props}
      onPointerDown={(event) => {
        pointerFocus.current = true;
        onPointerDown?.(event);
      }}
      onFocus={(event) => {
        focusWithin?.report(true);
        onFocus?.(event);
      }}
      onBlur={(event) => {
        pointerFocus.current = false;
        focusWithin?.report(false);
        onBlur?.(event);
      }}
      style={styleWithTransition as PressableProps["style"]}
    >
      {resolve(children) as PressableProps["children"]}
    </Pressable>
  );
}

/**
 * Map Pressable's runtime state (`{ pressed, focused }` on TV; plus `hovered` on web) to ours. On
 * web the highlight follows the pointer (hover) or keyboard focus, never click-focus.
 */
function highlightState(raw: unknown, focusFromPointer: boolean): InteractionState {
  const state = raw as { pressed: boolean; focused?: boolean; hovered?: boolean };
  if (Platform.OS !== "web") {
    return { pressed: state.pressed, focused: state.focused ?? false };
  }
  const keyboardFocus = (state.focused ?? false) && !focusFromPointer;
  return { pressed: state.pressed, focused: (state.hovered ?? false) || keyboardFocus };
}

/** The focus indicator chosen in Settings (outline ring or soft glow). */
export function useFocusIndicator(): FocusIndicator {
  return useFocusIndicatorSetting().value;
}

/**
 * The part of the focus indicator drawn *inside* the artwork. Render it last inside a clipped,
 * rounded container (poster art, card thumb) so focus never shifts layout:
 * - outline: a white ring;
 * - glow: a tvOS-style specular sheen — light catching the top of the artwork, fading down.
 * Pair it with `focusGlow` on the same container for the glow's outer shadow.
 */
export function FocusRing({ visible, radius }: { visible: boolean; radius: number }) {
  const indicator = useFocusIndicator();
  const decoration =
    indicator === "outline" ? (
      <View style={[styles.ring, { borderRadius: radius }]} />
    ) : (
      <GradientScrim
        color={theme.colors.white}
        from="top"
        endOpacity={SHEEN_OPACITY}
        style={[styles.sheen, { borderTopLeftRadius: radius, borderTopRightRadius: radius }]}
      />
    );

  // Web keeps it mounted and fades it (hover eases in/out); TV mounts it only when focused, so
  // rows of posters don't each carry an invisible overlay.
  if (Platform.OS === "web") {
    return <View style={[styles.fill, hoverTransition, { opacity: visible ? 1 : 0 }]}>{decoration}</View>;
  }
  return visible ? decoration : null;
}

/**
 * The glow indicator's outer part, after tvOS: no hard halo, just the lifted item floating — a
 * faint, wide, downward-biased white bloom (so it reads on the dark theme) over a soft dark drop
 * shadow. Apply to the same clipped, rounded container as `FocusRing`; an element's own shadow
 * isn't clipped by its `overflow`.
 */
export function focusGlow(indicator: FocusIndicator, focused: boolean): ViewStyle | null {
  return focused && indicator === "glow" ? styles.glow : null;
}

/** Peak opacity of the glow's specular sheen at the top edge of the artwork. */
const SHEEN_OPACITY = 0.14;

const FOCUS_SCALE = 1.06;

/** The lift applied to focused artwork. */
export const focusLift: ViewStyle = { transform: [{ scale: FOCUS_SCALE }] };

/**
 * Web only: ease highlight changes (hover in/out) instead of snapping. Applied to every
 * `Focusable`, and to inner containers that carry the highlight themselves (poster art with the
 * glow, the outline ring). `undefined` on native — TV focus stays instant and cheap.
 */
export const hoverTransition: ViewStyle | undefined =
  Platform.OS === "web"
    ? ({
        transitionProperty: "transform, background-color, box-shadow, opacity, border-color",
        transitionDuration: "180ms",
        transitionTimingFunction: "ease-out",
      } as ViewStyle)
    : undefined;

/** The glow's shadow layers: [offsetY, blur, colour]. No spread — spread is what reads as rough. */
const GLOW_LAYERS: ReadonlyArray<[offsetY: number, blur: number, color: string]> = [
  [10, 30, theme.colors.glowLight],
  [16, 28, theme.colors.glowShadow],
];

/** How far the glow reaches past the element's bottom edge — its furthest-reaching direction. */
const GLOW_REACH = Math.max(...GLOW_LAYERS.map(([offsetY, blur]) => offsetY + blur));

/** How far an item `size` points across overflows each side when `focusLift` scales it. */
export function liftRoom(size: number): number {
  return Math.ceil((size * (FOCUS_SCALE - 1)) / 2);
}

/**
 * Space to leave around focusable artwork inside a clipping container (a horizontal ScrollView
 * crops to its own bounds), so neither the lift nor the glow is cut off. Covers a ~300pt-tall item
 * growing by `FOCUS_SCALE` about its centre, plus the glow's reach.
 */
export const focusRoom = liftRoom(300) + GLOW_REACH;

interface FocusWithinValue {
  report: (focused: boolean) => void;
}

const FocusWithinContext = createContext<FocusWithinValue | null>(null);

/**
 * Tracks focus among descendant `Focusable`s. `onFocusChange` fires when focus enters or leaves
 * the region; `onFocusMove` fires on every focus change inside it (used to detect when a D-pad press
 * *didn't* move focus, i.e. hit an edge).
 */
export function FocusWithin({
  onFocusChange,
  onFocusMove,
  children,
}: {
  onFocusChange?: (within: boolean) => void;
  onFocusMove?: () => void;
  children: ReactNode;
}) {
  const focusedCount = useRef(0);
  const callbacks = useRef({ onFocusChange, onFocusMove });
  callbacks.current = { onFocusChange, onFocusMove };

  // What we last told the consumer, so only real enter/leave transitions are reported.
  const reportedWithin = useRef(false);

  const report = useCallback((focused: boolean) => {
    focusedCount.current = Math.max(0, focusedCount.current + (focused ? 1 : -1));
    if (focused) {
      callbacks.current.onFocusMove?.();
      if (!reportedWithin.current) {
        reportedWithin.current = true;
        callbacks.current.onFocusChange?.(true);
      }
      return;
    }
    // Moving between two children blurs the old one before focusing the new one; wait a tick so
    // that doesn't read as leaving the region.
    setTimeout(() => {
      if (focusedCount.current === 0 && reportedWithin.current) {
        reportedWithin.current = false;
        callbacks.current.onFocusChange?.(false);
      }
    }, 0);
  }, []);

  const value = useMemo(() => ({ report }), [report]);
  return <FocusWithinContext.Provider value={value}>{children}</FocusWithinContext.Provider>;
}

const styles = StyleSheet.create({
  glow: {
    boxShadow: GLOW_LAYERS.map(([offsetY, blur, color]) => `0px ${offsetY}px ${blur}px ${color}`).join(
      ", ",
    ),
  },
  fill: {
    ...StyleSheet.absoluteFill,
  },
  // The sheen covers the top half of the artwork, fading out by the middle.
  sheen: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "55%",
  },
  ring: {
    ...StyleSheet.absoluteFill,
    borderWidth: 3,
    borderColor: theme.colors.white,
  },
});
