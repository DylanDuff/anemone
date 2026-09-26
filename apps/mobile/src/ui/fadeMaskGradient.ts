//
// AnemoneReact is subject to the terms of the Mozilla Public License, v2.0.
//

/**
 * The alpha ramp shared by both `BottomFade` implementations: opaque until `solidUntil` (0…1 of the
 * height), transparent at the bottom. Only alpha matters to a mask, so the colour is black.
 */
export function fadeMaskGradient(solidUntil: number): string {
  return `linear-gradient(to bottom, rgba(0, 0, 0, 1) ${solidUntil * 100}%, rgba(0, 0, 0, 0) 100%)`;
}
