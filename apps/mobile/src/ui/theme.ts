//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//
// The single source of the app's look: colours, type, radii, spacing and card sizes. Components
// never hand-set a colour, font size/weight or corner radius — they compose these tokens.
//

import type { TextStyle } from "react-native";
import { isTV } from "./tv";

const colors = {
  background: "#0b0b0f",
  surface: "#17171d",
  text: "#f5f5f7",
  muted: "#9a9aa6",
  accent: "#7c5cff",
  error: "#ff6b6b",
  favorite: "#ff5c7a",
  white: "#ffffff",
  black: "#000000",
  /** Artwork placeholder, poster/card backgrounds. */
  placeholder: "#26262e",
  overlayStrong: "rgba(0,0,0,0.72)",
  overlaySoft: "rgba(0,0,0,0.35)",
  chip: "rgba(255,255,255,0.08)",
  chipActive: "rgba(255,255,255,0.92)",
  chipActiveText: "#0b0b0f",
  /** Secondary text on a `chipActive` (focused) surface. */
  chipActiveMuted: "rgba(11,11,15,0.7)",
  /** Hairline edge of floating surfaces (the navigation pill). */
  border: "rgba(255,255,255,0.14)",
  /** Stronger edge that defines glass buttons and chips. */
  borderStrong: "rgba(255,255,255,0.22)",
  /** Dividers between groups of controls. */
  separator: "rgba(255,255,255,0.18)",
  /** Unfilled part of a seek/progress track. */
  track: "rgba(255,255,255,0.3)",
  /** Tint of glass surfaces when live blur is off. */
  glassTint: "rgba(23,23,29,0.88)",
  /** Opaque-ish floating panels over video (track menu). */
  panel: "rgba(23,23,29,0.94)",
  /** The focus glow's white bloom and dark drop shadow. */
  glowLight: "rgba(255,255,255,0.12)",
  glowShadow: "rgba(0,0,0,0.55)",
} as const;

const weight = {
  regular: "400",
  medium: "500",
  semibold: "600",
  bold: "700",
} as const satisfies Record<string, TextStyle["fontWeight"]>;

/**
 * The type scale. Each style is size + default weight (+ line height where text wraps); override
 * `fontWeight` with a `weight` token and set `color` from `colors`.
 */
const type = {
  /** Title text over a hero when there's no logo. */
  display: { fontSize: 40, fontWeight: weight.bold },
  /** Page titles (Settings, a library, Search). */
  title: { fontSize: 32, fontWeight: weight.semibold },
  /** Section / shelf headers. */
  heading: { fontSize: 19, fontWeight: weight.regular },
  /** Emphasised lines: taglines, the player's title, card titles in a panel. */
  headline: { fontSize: 17, fontWeight: weight.semibold },
  /** Row labels, primary buttons. */
  label: { fontSize: 16, fontWeight: weight.medium },
  /** Reading text: overviews, menus. */
  body: { fontSize: 15, lineHeight: 23, fontWeight: weight.regular },
  /** Secondary UI text: counts, statuses, card titles. */
  callout: { fontSize: 14, fontWeight: weight.regular },
  /** Descriptions, chips, genres. */
  caption: { fontSize: 13, lineHeight: 18, fontWeight: weight.regular },
  /** Captions under artwork, small metadata. */
  footnote: { fontSize: 12, lineHeight: 17, fontWeight: weight.regular },
  /** Labels under navigation icons. */
  micro: { fontSize: 11, fontWeight: weight.medium },
  /** Uppercase group titles above settings, filters and menus. */
  eyebrow: {
    fontSize: 12,
    fontWeight: weight.semibold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
} as const satisfies Record<string, TextStyle>;

const radii = {
  /** Thin tracks. */
  hairline: 2,
  xs: 3,
  /** Detail chips over artwork. */
  sm: 6,
  /** Artwork: posters, cards, thumbnails. */
  md: 10,
  /** Panels, settings rows, dialogs. */
  lg: 14,
  /** Fully rounded ends (pills, circles). */
  pill: 999,
} as const;

/** Dark, media-forward theme. */
export const theme = {
  colors,
  weight,
  type,
  radii,
  /**
   * Horizontal inset of rows and screen content from the window edge (`compactGutter` on phones).
   * Read it through `useContentLayout()`, not directly.
   */
  gutter: 50,
  compactGutter: 20,
  poster: {
    // TV is ~960pt wide at 10 feet; smaller posters show more of each row.
    width: isTV ? 160 : 200,
    /** Phones (and narrow web): read sizes through `useCardWidths()`, not these directly. */
    compactWidth: 120,
    aspectRatio: 2 / 3, // width / height
  },
  /**
   * 16:9 card widths: Continue Watching (scaled down on TV like posters), episodes and extras.
   * Phones use `compactWidth` for all of them. Read through `useCardWidths()`.
   */
  landscapeCard: {
    width: isTV ? 280 : 360,
    episodeWidth: 320,
    extraWidth: 280,
    compactWidth: 260,
  },
} as const;

export function space(n: number): number {
  return n * 8;
}
