//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

import { PixelRatio } from "react-native";

/** Never request more than 4K wide; nothing we draw needs it. */
const MAX_IMAGE_WIDTH = 3840;

/**
 * The pixel width to request from the server for an image drawn `layoutWidth` points wide — the
 * device's real pixel density, capped at 4K. Pass it as `maxWidth` to every image source: an
 * unsized request makes the client decode a full-resolution image, and a row of those is enough
 * to exhaust a TV's memory.
 */
export function imagePixelWidth(layoutWidth: number): number {
  return Math.min(PixelRatio.getPixelSizeForLayoutSize(layoutWidth), MAX_IMAGE_WIDTH);
}
