/* Framing for Designer C's hero scene (lab). Kept apart from scene.ts so
   the component can lay out the poster without importing three.js.

   The mark is a square plate seen orthographically from an elevation of
   asin(100/231), turned 45°: that projects to the mark's 231:100 rhombus.
   "View units" are those of that projection: a plate's half-diagonal is
   1/√2, and the evidence plate's centre at rest is at view y = 0. */

export const REST_ELEV = Math.asin(100 / 231);
export const REST_YAW = Math.PI / 4;

/** View units per SVG unit of the mark's path data (half-width 231). */
export const SVG_UNIT = Math.SQRT1_2 / 231;

/** Vertical centre of the closed mark, in view units (SVG y 211). */
export const MARK_CY = (322 - 211) * SVG_UNIT;

export interface Framing {
  /** Half-width (and half-height: the stage is square) in view units. */
  hx: number;
  /** Extra canvas above and below the stage, as a fraction of its height. */
  overflow: number;
  /** How much further apart the plates move when open (1 = gaps double). */
  spread: number;
  /** Share of the extra height that goes below the evidence plate's rest
      position when open (0.5 = symmetric). Low on desktop so the open
      stack grows upward, away from the caption. */
  anchor: number;
}

export const FRAME_POINTER: Framing = { hx: 0.84, overflow: 0.14, spread: 0.5, anchor: 0.4 };
export const FRAME_TOUCH: Framing = { hx: 0.93, overflow: 0.06, spread: 0.55, anchor: 0.5 };

/** Where the mark's SVG (viewBox -15 -15 493 464) sits in the stage, as
    percentages, so the poster and the first WebGL frame coincide. */
export function posterBox(f: Framing) {
  const k = SVG_UNIT / (2 * f.hx); // stage fraction per SVG unit
  return {
    left: `${(0.5 - (231 + 15) * k) * 100}%`,
    top: `${(0.5 - (211 + 15) * k) * 100}%`,
    width: `${493 * k * 100}%`,
  };
}
