//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

/** Widest a settings page's rows grow on large screens (the header spans the page). */
export const SETTINGS_MAX_WIDTH = 900;

/** The size of a settings row's leading icon (Navigation, Appearance, About, …). */
export const SETTING_ICON_SIZE = 17;

/** Every row icon sits in a frame this wide, so labels line up whatever the glyph's shape. */
export const SETTING_ICON_FRAME = 24;

/**
 * A `SwatchSetting` well: the colour's diameter, the clear gap between it and the chosen ring, the
 * ring's width, and so the slot each well sits in (colour + gap + ring on each side).
 */
export const SWATCH_SIZE = 24;
export const SWATCH_RING_GAP = 1;
export const SWATCH_RING_WIDTH = 2;
export const SWATCH_SLOT = SWATCH_SIZE + (SWATCH_RING_GAP + SWATCH_RING_WIDTH) * 2;
/** Space between wells (nine fit a phone's settings row on one line). */
export const SWATCH_GAP = 4;
