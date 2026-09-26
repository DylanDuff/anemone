//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { createContext, useContext } from "react";
import { useWindowDimensions } from "react-native";
import { theme } from "./theme";
import { isTV } from "./tv";

/** Below this width (and not on TV), layouts switch to their phone form. */
const COMPACT_MAX_WIDTH = 700;

/** Whether to use phone layouts: narrow screens that aren't TVs (bottom tabs, stacked headers). */
export function useIsCompact(): boolean {
  const { width } = useWindowDimensions();
  return !isTV && width < COMPACT_MAX_WIDTH;
}

export interface ContentLayout {
  /** Width of the page. Full-bleed elements (hero artwork) span all of it. */
  readonly width: number;
  /** Where content starts from the left — past the floating section rail when there is one. */
  readonly insetLeft: number;
  readonly insetRight: number;
}

const ContentLayoutContext = createContext<Partial<ContentLayout> | null>(null);

/** Overrides the page layout for a subtree (the browse shell reserves room for its rail). */
export const ContentLayoutProvider = ContentLayoutContext.Provider;

/**
 * The current page's layout. Pages run full width — the section rail floats over them — so rows,
 * grids and captions start at `insetLeft` and scroll underneath the rail, while hero artwork uses
 * the full `width` and bleeds beneath it. Outside the browse shell this is the window with the
 * standard gutter.
 */
export function useContentLayout(): ContentLayout {
  const { width } = useWindowDimensions();
  const override = useContext(ContentLayoutContext);
  return {
    width: override?.width ?? width,
    insetLeft: override?.insetLeft ?? theme.gutter,
    insetRight: override?.insetRight ?? theme.gutter,
  };
}
