/* Framing for the hero's WebGL scene.

   Kept apart from scene.ts so HeroModel.tsx can choose a framing without
   importing three.js into the main bundle. The posters in public/hero/
   are frames rendered from the scene at these framings; re-render them
   (see the note in HeroModel.tsx) if anything here changes.

   The geometry rests on one fact about the mark: a square plate seen by
   an orthographic camera from an elevation of asin(100/231), turned 45°,
   projects to a rhombus of exactly 231:100, which is the mark's own
   ratio. "View units" below are those of that projection: the plate's
   half-diagonal is 1/√2 and the base plate's top-face centre is at 0. */

/** Elevation that projects a square to the mark's 231:100 rhombus. */
export const REST_ELEV = Math.asin(100 / 231);

/** View units per unit of the mark's SVG path data (half-width 231). */
export const SVG_UNIT = Math.SQRT1_2 / 231;

/* Two framings. The layout box (the "stage") is sized by CSS; these say
   which slice of view space it shows.

   Pointer devices rest closed, as the logo, and open on hover. The stage
   is centred on the closed object so it lines up with the headline, and
   the canvas runs `overflow` of the stage's height above it so the open
   stack has room without the layout reserving empty space for it.

   Touch devices rest closed too, but cannot overflow: the CTAs sit just
   above the stage there, and a canvas over them would take their taps.
   So the stage frames both states, centred a little above the closed
   object to leave the open stack its room. */
export interface Framing {
  /** Half-width of the stage, in view units. */
  hx: number;
  /** Vertical centre of the stage, in view units. */
  cy: number;
  /** Extra canvas above the stage, as a fraction of its height. */
  overflow: number;
}

export const FRAME_POINTER: Framing = { hx: 0.8, cy: 0.3, overflow: 0.14 };
export const FRAME_TOUCH: Framing = { hx: 0.84, cy: 0.4, overflow: 0 };
