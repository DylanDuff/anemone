//
// AnemoneReact is subject to the terms of the Mozilla Public
// License, v2.0. Ported from Swiftfin (c) Jellyfin & Jellyfin Contributors.
//

/**
 * Presentation enums shared by library view models. Values match Swiftfin's raw values so persisted
 * settings stay meaningful. `displayTitle`/`systemImage` metadata is retained for the eventual UI
 * (SF Symbol names); localization of titles is a backlog item (currently English).
 */

export type LibraryDisplayType = "grid" | "list";

export const libraryDisplayTypeValues: readonly LibraryDisplayType[] = ["grid", "list"];

export const libraryDisplayTypeMeta: Record<
    LibraryDisplayType,
    { displayTitle: string; systemImage: string }
> = {
    grid: { displayTitle: "Grid", systemImage: "square.grid.2x2.fill" },
    list: { displayTitle: "List", systemImage: "square.fill.text.grid.1x2" },
};

export type PosterDisplayType = "landscape" | "portrait" | "square";

export const posterDisplayTypeValues: readonly PosterDisplayType[] = [
    "landscape",
    "portrait",
    "square",
];

/** Poster types the library views currently support (Swiftfin `supportedCases`). */
export const supportedPosterDisplayTypes: readonly PosterDisplayType[] = ["landscape", "portrait"];

export const posterDisplayTypeMeta: Record<
    PosterDisplayType,
    { displayTitle: string; systemImage: string }
> = {
    landscape: { displayTitle: "Landscape", systemImage: "rectangle.fill" },
    portrait: { displayTitle: "Portrait", systemImage: "rectangle.portrait.fill" },
    square: { displayTitle: "Square", systemImage: "square.fill" },
};
