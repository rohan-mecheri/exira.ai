/* Framing for Designer B's hero scene. No three.js here, so the
   component can import it without pulling the scene into the bundle.

   A square plate seen by an orthographic camera from an elevation of
   asin(100/231), turned 45°, projects to the mark's 462 x 200 rhombus.
   View units: the plate's half-diagonal is 1/√2 and the base plate's
   centre is at the origin. */

export const REST_ELEV = Math.asin(100 / 231);
export const REST_YAW = Math.PI / 4;
/** View units per SVG unit of the mark. */
export const SVG_UNIT = Math.SQRT1_2 / 231;

export interface Framing {
  /** Half-width of the (square) stage, in view units. */
  hx: number;
  /** Vertical centre of the stage, in view units. */
  cy: number;
}

/** The stage is centred on the closed mark. */
export const FRAME: Framing = { hx: 0.8, cy: 0.34 };

/** How far the canvas runs past the stage on each side, as fractions of
    the stage size, so the open or turned stack never clips. Must match
    the canvas inset in heroB.module.css. */
export const BLEED = { top: 0.3, bottom: 0.14, side: 0.14 };

/** The poster's viewBox: exactly the slice of the mark the canvas shows
    at rest (stage plus bleed), so poster and first frame coincide. */
export function posterViewBox(f: Framing = FRAME): string {
  const w = (2 * f.hx) / SVG_UNIT;
  const x = 231 - f.hx / SVG_UNIT - BLEED.side * w;
  const y = 322 - (f.cy + f.hx) / SVG_UNIT - BLEED.top * w;
  const vw = (1 + 2 * BLEED.side) * w;
  const vh = (1 + BLEED.top + BLEED.bottom) * w;
  return `${x.toFixed(3)} ${y.toFixed(3)} ${vw.toFixed(3)} ${vh.toFixed(3)}`;
}
