//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

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
    },
    poster: {
        width: 132,
        radius: 10,
        aspectRatio: 2 / 3, // width / height
    },
    radius: 14,
} as const;

export function space(n: number): number {
    return n * 8;
}
