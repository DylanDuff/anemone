//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { isTV } from "./tv";

/** Dark, media-forward theme used by the home experience. */
export const theme = {
  colors: {
    background: "#0b0b0f",
    surface: "#17171d",
    text: "#f5f5f7",
    muted: "#9a9aa6",
    accent: "#7c5cff",
    overlayStrong: "rgba(0,0,0,0.72)",
    overlaySoft: "rgba(0,0,0,0.35)",
    placeholder: "#26262e",
    error: "#ff6b6b",
    white: "#ffffff",
    chip: "rgba(255,255,255,0.08)",
    chipActive: "rgba(255,255,255,0.92)",
    chipActiveText: "#0b0b0f",
    favorite: "#ff5c7a",
  },
  /** Horizontal inset of rows and screen content from the window edge. */
  gutter: 50,
  poster: {
    // TV is ~960pt wide at 10 feet; smaller posters show more of each row.
    width: isTV ? 160 : 200,
    radius: 10,
    aspectRatio: 2 / 3, // width / height
  },
  /** Default width of 16:9 cards (Continue Watching); scaled down on TV like posters. */
  landscapeCard: {
    width: isTV ? 280 : 360,
  },
  radius: 14,
} as const;

export function space(n: number): number {
  return n * 8;
}
