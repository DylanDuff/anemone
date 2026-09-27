//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { createContext, useContext } from "react";
import { Platform, useWindowDimensions } from "react-native";
import { theme } from "./theme";
import { isTV } from "./tv";

/** Below this width (and not on TV), layouts switch to their phone form. */
const COMPACT_MAX_WIDTH = 700;

/** Whether to use phone layouts: narrow screens that aren't TVs (bottom tabs, stacked headers). */
export function useIsCompact(): boolean {
  const { width } = useWindowDimensions();
  return !isTV && width < COMPACT_MAX_WIDTH;
}

/**
 * Whether this is a phone: the native app at compact width (not web — even a narrow window — nor
 * tablets or TV). Touch-only, and with phone-only affordances like the docked search field.
 */
export function useIsPhone(): boolean {
  const compact = useIsCompact();
  return Platform.OS !== "web" && compact;
}

/** The page's side margin: tighter on phones / narrow web. */
export function gutterFor(compact: boolean): number {
  return compact ? theme.compactGutter : theme.gutter;
}

export interface CardWidths {
  readonly poster: number;
  /** Continue Watching. */
  readonly landscapeCard: number;
  readonly episodeCard: number;
  /** Trailers, special features, additional parts. */
  readonly extraCard: number;
}

/** Poster and 16:9 card widths for this screen — smaller on phones / narrow web. */
export function useCardWidths(): CardWidths {
  const compact = useIsCompact();
  const { poster, landscapeCard } = theme;
  if (compact) {
    return {
      poster: poster.compactWidth,
      landscapeCard: landscapeCard.compactWidth,
      episodeCard: landscapeCard.compactWidth,
      extraCard: landscapeCard.compactWidth,
    };
  }
  return {
    poster: poster.width,
    landscapeCard: landscapeCard.width,
    episodeCard: landscapeCard.episodeWidth,
    extraCard: landscapeCard.extraWidth,
  };
}

export interface ContentLayout {
  /** Width of the page. Full-bleed elements (hero artwork) span all of it. */
  readonly width: number;
  /** Where content starts from the left — past the navigation pill when it floats on that side. */
  readonly insetLeft: number;
  readonly insetRight: number;
  /**
   * Room to leave above / below a page's content: the safe area (status bar, home indicator), or
   * a pill floating along that edge. Add to the page's own padding; hero artwork ignores it and
   * bleeds beneath. 0 outside the browse shell, where screens handle their own safe area.
   */
  readonly insetTop: number;
  readonly insetBottom: number;
}

const ContentLayoutContext = createContext<Partial<ContentLayout> | null>(null);

/** Overrides the page layout for a subtree (the browse shell reserves room for its pill). */
export const ContentLayoutProvider = ContentLayoutContext.Provider;

/**
 * The current page's layout. Pages run full size — the navigation pill floats over them — so rows,
 * grids and captions start inside the insets and scroll underneath the pill, while hero artwork
 * uses the full `width` and bleeds beneath it. Outside the browse shell this is the window with
 * the standard gutter.
 */
export function useContentLayout(): ContentLayout {
  const { width } = useWindowDimensions();
  const gutter = gutterFor(useIsCompact());
  const override = useContext(ContentLayoutContext);
  return {
    width: override?.width ?? width,
    insetLeft: override?.insetLeft ?? gutter,
    insetRight: override?.insetRight ?? gutter,
    insetTop: override?.insetTop ?? 0,
    insetBottom: override?.insetBottom ?? 0,
  };
}
