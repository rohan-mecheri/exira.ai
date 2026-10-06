import * as THREE from "three";
import { REST_ELEV, SVG_UNIT, type Framing } from "./frame";

/* ══════════════════════════════════════════════════════════
   The hero object: the Exira mark, built as the object it draws.

   First frame: the mark, path for path. Each plate is its layer's own
   path in public/brand/exira-icon-transparent.svg, un-projected onto the
   plate's plane (an orthographic camera is affine, so from the rest pose
   each plate projects back onto exactly that path), and faced with the
   layer's own gradient, stroke and dots. Shading is relative to the rest
   pose, so it is zero there. Nothing else is drawn in that frame, and
   that frame is the poster.

   Then the object comes alive, gently (`alive`, 0 → 1 over ~1.4 s):
   · it starts a slow turntable, one turn in 50 s, at the mark's own
     elevation, so at a glance it is always the mark;
   · its construction grows in: each plate gains a real thickness with a
     lit, chamfered edge; four telescoping stand-offs hold the plates at
     their pitch; the stack stands on a soft contact shadow;
   · the plates' fine detail appears: the two analytical plates are
     machined into lanes (six modules, five cross-checks), each a shallow
     recessed channel with a locator at its head; the blue assessment
     carries an inset groove and the seat its finding starts from; the
     evidence plate becomes a field of drilled wells on a fine sub-grid.

   Hover (or tap, or Enter) stops the turn where it is and opens the
   stack: the stand-offs extend, the lanes come up to full strength, and
   one finding is traced: a dot on the blue plate, a thread down through
   the cross-check lane and the module lane it crosses (each lights as the
   thread reaches it), landing on one well of the evidence plate. Leave,
   and it closes and eases back into the turn.

   Loaded on demand by components/HeroModel.tsx.
   ══════════════════════════════════════════════════════════ */

export { REST_ELEV };
/** Yaw that puts the gradient's dark end on the left tip. */
export const REST_YAW = Math.PI / 4;

const SIN_E = Math.sin(REST_ELEV); // exactly 100/231
const COS_E = Math.cos(REST_ELEV);

/* ── the mark, from public/brand/exira-icon-transparent.svg ── */

type PartKey = "base" | "lower" | "upper" | "top";
export type PartId = { kind: PartKey };

interface LayerDef {
  key: PartKey;
  d: string;
  cy: number;
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  fill: [number, string][] | string;
  dots?: boolean;
  /** The plate's edge (its side wall), as a material colour. */
  edge: string;
}

const LAYERS: LayerDef[] = [
  {
    key: "base",
    d: "M 233.75 223.19 L 459.25 320.81 Q 462.00 322.00 459.25 323.19 L 233.75 420.81 Q 231.00 422.00 228.25 420.81 L 2.75 323.19 Q 0.00 322.00 2.75 320.81 L 228.25 223.19 Q 231.00 222.00 233.75 223.19 Z",
    cy: 322,
    fill: "#F9FBFF",
    stroke: "#CADBFF",
    strokeWidth: 1,
    strokeOpacity: 0.8,
    dots: true,
    edge: "#DCE5F6",
  },
  {
    key: "lower",
    d: "M 235.59 149.99 L 457.41 246.01 Q 462.00 248.00 457.41 249.99 L 235.59 346.01 Q 231.00 348.00 226.41 346.01 L 4.59 249.99 Q 0.00 248.00 4.59 246.01 L 226.41 149.99 Q 231.00 148.00 235.59 149.99 Z",
    cy: 248,
    fill: [
      [0, "#E4E9F3"],
      [0.55, "#E9EDF6"],
      [1, "#F0F3F9"],
    ],
    stroke: "#FFFFFF",
    strokeWidth: 1.4,
    strokeOpacity: 1,
    edge: "#D2D9E6",
  },
  {
    key: "upper",
    d: "M 236.51 76.38 L 456.49 171.62 Q 462.00 174.00 456.49 176.38 L 236.51 271.62 Q 231.00 274.00 225.49 271.62 L 5.51 176.38 Q 0.00 174.00 5.51 171.62 L 225.49 76.38 Q 231.00 74.00 236.51 76.38 Z",
    cy: 174,
    fill: [
      [0, "#D6DCE9"],
      [0.55, "#DCE2ED"],
      [1, "#E3E8F2"],
    ],
    stroke: "#FFFFFF",
    strokeWidth: 1.5,
    strokeOpacity: 0.95,
    edge: "#C6CEDD",
  },
  {
    key: "top",
    d: "M 237.42 2.78 L 455.58 97.22 Q 462.00 100.00 455.58 102.78 L 237.42 197.22 Q 231.00 200.00 224.58 197.22 L 6.42 102.78 Q 0.00 100.00 6.42 97.22 L 224.58 2.78 Q 231.00 0.00 237.42 2.78 Z",
    cy: 100,
    fill: [
      [0, "#06307C"],
      [0.3, "#0B3785"],
      [0.55, "#234D9E"],
      [0.78, "#426EB7"],
      [1, "#6F92D7"],
    ],
    stroke: "#174E9E",
    strokeWidth: 1.25,
    strokeOpacity: 0.8,
    edge: "#0A2E6E",
  },
];

/** The mark's own layer pitch (74 SVG units) as a world height. */
const PITCH = (74 * SVG_UNIT) / COS_E;
/** How much further apart the layers move when open, as a fraction. */
const OPEN = 0.34;
/** Plate thickness, world units, per layer (base, lower, upper, top),
    from SVG units on screen: the evidence plate is the plinth, the blue
    plate a touch heavier than the grey. */
const THICK = [10, 6.5, 6.5, 8].map((t) => (t * SVG_UNIT) / COS_E);
const SVG_W = 462;
const LAYER_HALF_H = 100;
const PAD = 3;
/** One SVG unit as a length in the plate's own plane (along the plate's
    diagonal at rest, which is where the picture's x runs). */
const PU = SVG_UNIT * Math.SQRT2;

/* Elevation limits: below 14° the plates turn to slivers; above 42° the
   blue plate hides everything beneath it. */
const ELEV_MIN = (14 * Math.PI) / 180;
const ELEV_MAX = (42 * Math.PI) / 180;
const GIVE = (2 * Math.PI) / 180;

/** The turntable: one turn in 17 s. */
const IDLE_W = (2 * Math.PI) / 17;
/** Open, the view lowers to this elevation: the stack is seen more from
    the side, so the trace through the plates' centres shows in every gap. */
const OPEN_ELEV = (17 * Math.PI) / 180;

/* The lanes. Lower grey: six module lanes, divided along x. Upper grey:
   five cross-check lanes, divided along z. */
const LOWER_N = 6;
const UPPER_N = 5;

/* The trace runs through the centre of every plate: from the seat at
   the assessment's centre, through the middle cross-check lane (3 of 5),
   between the two middle module lanes (3 and 4 of 6, which both light),
   to the well at the centre of the evidence plate. */
const GRID = 14;
const TX = 0;
const TZ = 0;
const laneOf = (v: number, n: number) => Math.min(n - 1, Math.max(0, Math.floor((v + 0.5) * n)));

/* Stand-offs: four, on the plate's diagonals, inset from the corners. */
/* Spacers: four short pillars well inboard (about 36% of the way from
   the centre to each corner), tone-matched to the plates, so at the
   mark's elevation each hides under the plate above it and the
   silhouette is only ever plates and gaps. */
const POSTS: [number, number][] = [
  [-0.18, -0.18],
  [0.18, -0.18],
  [0.18, 0.18],
  [-0.18, 0.18],
];
const POST_R = 0.016;

export interface MountOptions {
  reduce: boolean;
  coarse: boolean;
  framing: Framing;
  onPart: (part: PartId | null) => void;
  onOpen: (open: boolean) => void;
  onDrag: (dragging: boolean) => void;
  onReady: () => void;
}

export interface HeroHandle {
  setActive(active: boolean): void;
  nudge(dyaw: number, delev: number): void;
  toggleOpen(): void;
  setFocusOpen(open: boolean): void;
  /** Test hook: pose exactly (alive 0 = the bare mark) and render. */
  pose(yaw: number, elev: number, open: number, alive?: number): void;
  /** Test hook: hold the turntable still (true) or let it run. */
  freeze(on: boolean): void;
  state(): { yaw: number; elev: number; open: number; thread: number; alive: number; running: boolean; part: string | null };
  dispose(): void;
}

/* ── geometry ─────────────────────────────────────────── */

function pathShape(d: string) {
  const t = d.trim().split(/[\s,]+/);
  const s = new THREE.Shape();
  let i = 0;
  const n = () => parseFloat(t[i++]);
  while (i < t.length) {
    const c = t[i++];
    if (c === "M") s.moveTo(n(), n());
    else if (c === "L") s.lineTo(n(), n());
    else if (c === "Q") {
      const x1 = n(), y1 = n(), x = n(), y = n();
      s.quadraticCurveTo(x1, y1, x, y);
    } else if (c === "Z") s.closePath();
  }
  return s;
}

/** SVG point → plate (x, z): the inverse of the rest projection. */
function unproject(sx: number, sy: number, cy: number): [number, number] {
  const X = (sx - 231) * SVG_UNIT;
  const Y = -(sy - cy) * SVG_UNIT;
  return [(X + Y / SIN_E) / Math.SQRT2, (X - Y / SIN_E) / Math.SQRT2];
}

function plateGeometry(L: LayerDef) {
  const shape = pathShape(L.d);
  const kx = (231 + PAD) / 231;
  const ky = (LAYER_HALF_H + PAD) / LAYER_HALF_H;
  const pts = shape.getPoints(24).map((p) => new THREE.Vector2(231 + (p.x - 231) * kx, L.cy + (p.y - L.cy) * ky));
  const g = new THREE.ShapeGeometry(new THREE.Shape(pts));
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  const nrm = new Float32Array(pos.count * 3);
  for (let i = 0; i < pos.count; i++) {
    const sx = pos.getX(i);
    const sy = pos.getY(i);
    const [x, z] = unproject(sx, sy, L.cy);
    pos.setXYZ(i, x, 0, z);
    uv.setXY(i, (sx + PAD) / (SVG_W + 2 * PAD), 1 - (sy - (L.cy - LAYER_HALF_H) + PAD) / (2 * LAYER_HALF_H + 2 * PAD));
    nrm[i * 3 + 1] = 1;
  }
  g.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  g.computeBoundingSphere();
  return g;
}

/** The plate's edge: a wall around its own outline (the path, with its
    own corner radius), from its face (y = 0) down to y = -1. Scaled by
    the thickness at run time; `v` runs 0 at the top lip to 1 below. */
function edgeGeometry(L: LayerDef) {
  const pts = pathShape(L.d)
    .getPoints(16)
    .map((p) => unproject(p.x, p.y, L.cy));
  // Drop the closing duplicate.
  if (pts.length > 1) {
    const a = pts[0];
    const b = pts[pts.length - 1];
    if (Math.hypot(a[0] - b[0], a[1] - b[1]) < 1e-6) pts.pop();
  }
  const n = pts.length;
  // Signed area tells the winding, so normals point outward.
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [x0, z0] = pts[i];
    const [x1, z1] = pts[(i + 1) % n];
    area += x0 * z1 - x1 * z0;
  }
  const sgn = area > 0 ? -1 : 1;
  // Vertex normals: average of the two adjoining edges, so the rounded
  // corners shade smoothly.
  const vn = pts.map((_, i) => {
    const [xp, zp] = pts[(i - 1 + n) % n];
    const [x, z] = pts[i];
    const [xn, zn] = pts[(i + 1) % n];
    const e1 = [x - xp, z - zp];
    const e2 = [xn - x, zn - z];
    const n1 = [e1[1] * sgn, -e1[0] * sgn];
    const n2 = [e2[1] * sgn, -e2[0] * sgn];
    const l1 = Math.hypot(n1[0], n1[1]) || 1;
    const l2 = Math.hypot(n2[0], n2[1]) || 1;
    const nx = n1[0] / l1 + n2[0] / l2;
    const nz = n1[1] / l1 + n2[1] / l2;
    const l = Math.hypot(nx, nz) || 1;
    return [nx / l, nz / l];
  });
  // Three rings: the lip (v 0), the end of the chamfer (v .35), the foot
  // (v 1). The chamfer ring is shared, so it shades as one rounded lip.
  const rings = [0, 0.4, 1];
  const pos: number[] = [];
  const nor: number[] = [];
  const vv: number[] = [];
  for (const v of rings)
    for (let i = 0; i < n; i++) {
      pos.push(pts[i][0], -v, pts[i][1]);
      nor.push(vn[i][0], 0, vn[i][1]);
      vv.push(v);
    }
  const idx: number[] = [];
  for (let r = 0; r < rings.length - 1; r++)
    for (let i = 0; i < n; i++) {
      const a = r * n + i;
      const b = r * n + ((i + 1) % n);
      const c = (r + 1) * n + i;
      const d = (r + 1) * n + ((i + 1) % n);
      idx.push(a, c, b, b, c, d);
    }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  g.setAttribute("vv", new THREE.Float32BufferAttribute(vv, 1));
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/* ── textures: the SVG, drawn ─────────────────────────── */

function layerCanvas(L: LayerDef, scale: number) {
  const w = Math.ceil((SVG_W + 2 * PAD) * scale);
  const h = Math.ceil((2 * LAYER_HALF_H + 2 * PAD) * scale);
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d")!;
  g.setTransform(scale, 0, 0, scale, PAD * scale, (PAD - (L.cy - LAYER_HALF_H)) * scale);
  return { cv, g, w, h };
}

/** Plate (x, z) as the canvas's user space: the rest projection. */
function toPlate(g: CanvasRenderingContext2D, L: LayerDef) {
  const k = 1 / (Math.SQRT2 * SVG_UNIT);
  g.transform(k, -SIN_E * k, k, SIN_E * k, 231, L.cy);
}

function fillStyle(g: CanvasRenderingContext2D, fill: LayerDef["fill"]) {
  if (typeof fill === "string") return fill;
  const lg = g.createLinearGradient(0, 0, SVG_W, 0);
  for (const [o, c] of fill) lg.addColorStop(o, c);
  return lg;
}

function paintFace(g: CanvasRenderingContext2D, L: LayerDef, p: Path2D) {
  g.fillStyle = fillStyle(g, L.fill);
  g.fill(p);
  g.globalAlpha = L.strokeOpacity;
  g.strokeStyle = L.stroke;
  g.lineWidth = L.strokeWidth;
  g.lineJoin = L.key === "top" ? "round" : "miter";
  g.stroke(p);
  g.globalAlpha = 1;
}

/** The layer exactly as the SVG paints it. */
function faceTexture(L: LayerDef, scale: number) {
  const { cv, g } = layerCanvas(L, scale);
  const p = new Path2D(L.d);
  paintFace(g, L, p);
  if (L.dots) {
    g.save();
    g.clip(p);
    g.fillStyle = "rgba(78,142,255,0.5)";
    for (let y = 7.5; y < L.cy + LAYER_HALF_H + 15; y += 15)
      for (let x = 8.5; x < SVG_W + 17; x += 17) {
        if (y < L.cy - LAYER_HALF_H - 15) continue;
        g.beginPath();
        g.arc(x, y, 1.2, 0, Math.PI * 2);
        g.fill();
      }
    g.restore();
  }
  return toTexture(cv);
}

/** A rounded rectangle in plate units. */
function rrect(g: CanvasRenderingContext2D, x0: number, z0: number, x1: number, z1: number, r: number) {
  g.beginPath();
  g.moveTo(x0 + r, z0);
  g.lineTo(x1 - r, z0);
  g.arcTo(x1, z0, x1, z0 + r, r);
  g.lineTo(x1, z1 - r);
  g.arcTo(x1, z1, x1 - r, z1, r);
  g.lineTo(x0 + r, z1);
  g.arcTo(x0, z1, x0, z1 - r, r);
  g.lineTo(x0, z0 + r);
  g.arcTo(x0, z0, x0 + r, z0, r);
  g.closePath();
}

/** An engraved line: a shadowed wall and a lit wall, side by side. The
    light is fixed to the plate (upper left at the rest pose), so the
    engraving reads as cut, not printed. `dark` and `lit` are colours. */
function engrave(g: CanvasRenderingContext2D, path: () => void, w: number, dark: string, lit: string) {
  g.lineWidth = w;
  g.save();
  g.translate(w * 0.55, w * 0.55);
  path();
  g.strokeStyle = lit;
  g.stroke();
  g.restore();
  path();
  g.strokeStyle = dark;
  g.stroke();
}

/** A plate's fine detail, in its own plane. Shown once the object is
    alive (never in the first frame), at full strength when open. */
function detailTexture(L: LayerDef, scale: number) {
  const { cv, g } = layerCanvas(L, scale);
  g.save();
  g.clip(new Path2D(L.d));
  toPlate(g, L);
  const hair = 0.9 * PU; // a hairline: under a CSS px at hero size
  const frame = () => rrect(g, -0.465, -0.465, 0.465, 0.465, 0.03);
  if (L.key === "top") {
    // An inset groove around the assessment, and the seat its finding
    // starts from.
    engrave(g, frame, hair * 1.25, "rgba(2,20,64,0.6)", "rgba(170,198,250,0.55)");
    engrave(
      g,
      () => {
        g.beginPath();
        g.arc(TX, TZ, 0.022, 0, Math.PI * 2);
      },
      hair,
      "rgba(2,20,64,0.40)",
      "rgba(160,190,245,0.32)"
    );
  } else if (L.key === "lower" || L.key === "upper") {
    // Machined lanes: each a shallow recessed channel with rounded ends,
    // its wall shadowed on one side and lit on the other, and a drilled
    // locator at its head.
    const n = L.key === "lower" ? LOWER_N : UPPER_N;
    const gap = 0.012;
    const m = 0.045;
    for (let i = 0; i < n; i++) {
      const a0 = -0.5 + i / n + gap;
      const a1 = -0.5 + (i + 1) / n - gap;
      const lane = () =>
        L.key === "lower" ? rrect(g, a0, -0.5 + m, a1, 0.5 - m, 0.018) : rrect(g, -0.5 + m, a0, 0.5 - m, a1, 0.018);
      lane();
      // Each lane carries a faint brand-blue hue (#234D9E).
      g.fillStyle = "rgba(35,77,158,0.09)";
      g.fill();
      // A recess: the wall facing the light is in shadow, the far wall lit.
      engrave(g, lane, hair * 1.25, "rgba(0,20,72,0.30)", "rgba(255,255,255,0.8)");
    }
  } else {
    // Evidence: an inset groove; the wells are on the plate-dot face.
    engrave(g, frame, hair, "rgba(40,90,190,0.20)", "rgba(255,255,255,0.95)");
  }
  g.restore();
  return toTexture(cv);
}

/** The crossed lane's light, as a mask in the plate's plane. */
function tintTexture(L: LayerDef, scale: number) {
  const { cv, g } = layerCanvas(L, scale);
  g.save();
  g.clip(new Path2D(L.d));
  toPlate(g, L);
  const n = L.key === "lower" ? LOWER_N : UPPER_N;
  // The lane(s) the thread runs through: with an even count the centre
  // is the land between the middle two, and both light.
  const c = (L.key === "lower" ? TX : TZ) + 0.5;
  const lanes = n % 2 === 0 && Math.abs(c * n - Math.round(c * n)) < 1e-6 ? [Math.round(c * n) - 1, Math.round(c * n)] : [laneOf(c - 0.5, n)];
  g.fillStyle = "#234D9E";
  for (const i of lanes) {
    const a0 = -0.5 + i / n + 0.012;
    const a1 = -0.5 + (i + 1) / n - 0.012;
    if (L.key === "lower") rrect(g, a0, -0.455, a1, 0.455, 0.018);
    else rrect(g, -0.455, a0, 0.455, a1, 0.018);
    g.fill();
  }
  g.restore();
  return toTexture(cv);
}

/** The evidence plate once alive: the same fill and outline, with the
    dots as drilled wells on a square grid in the plate's own plane (each
    with a shadowed rim and a lit floor), on a finer sub-grid that only
    shows up close. */
function plateDotTexture(L: LayerDef, scale: number) {
  const { cv, g } = layerCanvas(L, scale);
  const p = new Path2D(L.d);
  paintFace(g, L, p);
  g.save();
  g.clip(p);
  toPlate(g, L);
  // Wells at every 1/28 of the plate (twice the mark's dot density):
  // texture rather than pattern. The trace lands on one of them.
  const N = GRID * 2;
  for (let i = 1; i < N; i++)
    for (let j = 1; j < N; j++) {
      const x = -0.5 + i / N;
      const z = -0.5 + j / N;
      // The well's mouth in the evidence blue (#4E8EFF), its wall in
      // shadow on the light's side, and a lit floor.
      g.beginPath();
      g.arc(x, z, 0.0048, 0, Math.PI * 2);
      g.fillStyle = "rgba(78,142,255,0.78)";
      g.fill();
      g.beginPath();
      g.arc(x - 0.0008, z - 0.0008, 0.0032, 0, Math.PI * 2);
      g.fillStyle = "rgba(30,80,180,0.45)";
      g.fill();
      g.beginPath();
      g.arc(x + 0.0010, z + 0.0010, 0.0020, 0, Math.PI * 2);
      g.fillStyle = "rgba(200,220,255,0.9)";
      g.fill();
    }
  g.restore();
  return toTexture(cv);
}

function toTexture(cv: HTMLCanvasElement) {
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.premultiplyAlpha = true;
  return t;
}

/** The stack's contact with the ground: its own footprint, softened. */
function groundTexture() {
  const n = 256;
  const cv = document.createElement("canvas");
  cv.width = cv.height = n;
  const g = cv.getContext("2d")!;
  // Plane is 1.5 plate units; the plate's footprint is 1 of them.
  const f = n / 1.5;
  const o = (n - f) / 2;
  // Blurred by drawing each shape far off-canvas and keeping only its
  // shadow (canvas filters are not everywhere yet).
  const soft = (x: number, w: number, blur: number, a: number) => {
    g.shadowColor = `rgba(0,20,72,${a})`;
    g.shadowBlur = blur;
    g.shadowOffsetX = 4 * n;
    g.fillStyle = "#000";
    g.fillRect(x - 4 * n, x, w, w);
  };
  soft(o - 2, f + 4, 16, 0.05);
  soft(o + 1, f - 2, 5, 0.10);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ── materials ─────────────────────────────────────────── */

/* View-space light, upper left and in front, and the rest normal. */
const LIGHT = new THREE.Vector3(-0.42, 0.78, 0.46).normalize();
const N_REST = new THREE.Vector3(0, COS_E, SIN_E);

const plateVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN;
  void main() {
    vUv = uv;
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const plateFragment = /* glsl */ `
  uniform sampler2D map;
  uniform sampler2D map2;
  uniform float mix2;
  uniform vec3 light;
  uniform vec3 nRest;
  uniform float shade;
  uniform float sheen;
  uniform float lift;
  uniform float dim;
  uniform float opacity;
  varying vec2 vUv;
  varying vec3 vN;
  float spec(vec3 n) {
    vec3 h = normalize(light + vec3(0.0, 0.0, 1.0));
    return pow(max(dot(n, h), 0.0), 48.0);
  }
  void main() {
    vec4 t = texture2D(map, vUv);
    if (mix2 > 0.0) t = mix(t, texture2D(map2, vUv), mix2);
    if (t.a * opacity < 0.02) discard;
    vec3 n = normalize(vN);
    // Zero at rest by construction, so the rest frame is the texture.
    float d = dot(n, light) - dot(nRest, light);
    float s = spec(n) - spec(nRest);
    vec3 c = t.rgb * (1.0 + shade * d + 0.06 * lift) + vec3(sheen * s) * t.a;
    c = mix(c, vec3(0.855, 0.879, 0.930) * t.a, 0.07 * dim);
    float alpha = t.a * opacity;
    gl_FragColor = vec4(c / max(t.a, 1e-4), 1.0);
    #include <colorspace_fragment>
    float dn = fract(52.9829189 * fract(dot(gl_FragCoord.xy, vec2(0.06711056, 0.00583715))));
    gl_FragColor.rgb += (dn - 0.5) / 255.0;
    gl_FragColor = vec4(gl_FragColor.rgb * alpha, alpha);
  }`;

function plateMaterial(map: THREE.Texture, shade: number, sheen: number, depthWrite = true) {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: map },
      map2: { value: map },
      mix2: { value: 0 },
      light: { value: LIGHT },
      nRest: { value: N_REST },
      shade: { value: shade },
      sheen: { value: sheen },
      lift: { value: 0 },
      dim: { value: 0 },
      opacity: { value: 1 },
    },
    vertexShader: plateVertex,
    fragmentShader: plateFragment,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite,
    alphaTest: 0.02,
    side: THREE.DoubleSide,
  });
}

/* Solid parts (plate edges, stand-offs): a soft Lambert with a lit
   chamfer. `vv` < .35 is the edge's rounded lip, whose normal leans up
   into the light, so every plate carries a fine bright line along its
   top edge that travels as it turns. */
const solidVertex = /* glsl */ `
  attribute float vv;
  varying vec3 vN;
  varying vec3 vUp;
  varying float vV;
  void main() {
    vN = normalize(normalMatrix * normal);
    vUp = normalize(normalMatrix * vec3(0.0, 1.0, 0.0));
    vV = vv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const solidFragment = /* glsl */ `
  uniform vec3 color;
  uniform vec3 light;
  uniform float lip;
  uniform float rim;
  varying vec3 vN;
  varying vec3 vUp;
  varying float vV;
  void main() {
    vec3 n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0);
    // The chamfer: the normal leans up toward the face across the lip.
    float k = lip * (1.0 - smoothstep(0.0, 0.4, vV));
    n = normalize(mix(n, normalize(vUp), k * 0.85));
    float l = max(dot(n, light), 0.0);
    vec3 h = normalize(light + vec3(0.0, 0.0, 1.0));
    float sp = pow(max(dot(n, h), 0.0), 40.0);
    // Key from the upper left with a 0.3 fill; the lip catches a soft
    // reflection of the room as it turns toward the viewer.
    vec3 c = color * (0.62 + 0.52 * l) + vec3(0.26 * sp * (0.3 + k));
    float fr = pow(1.0 - abs(n.z), 3.0);
    c += vec3(0.10 * k * (1.0 - fr));
    // A grazing rim along the lip.
    c += vec3(rim * k * pow(max(dot(normalize(vUp), n), 0.0), 2.0) * (0.4 + 0.6 * l));
    // Toward the foot, a touch of occlusion.
    c *= 1.0 - 0.12 * smoothstep(0.45, 1.0, vV);
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }`;

function solidMaterial(color: string, lip: number) {
  return new THREE.ShaderMaterial({
    uniforms: {
      color: { value: new THREE.Color(color) },
      light: { value: LIGHT },
      lip: { value: lip },
      rim: { value: 0 },
    },
    vertexShader: solidVertex,
    fragmentShader: solidFragment,
    side: THREE.DoubleSide,
  });
}

/* ── easing ───────────────────────────────────────────── */
const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);

export function mount(host: HTMLElement, opts: MountOptions): HeroHandle {
  const { reduce, coarse, framing } = opts;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -20, 20);
  camera.position.set(0, 0, 10);
  camera.lookAt(0, 0, 0);

  const tilt = new THREE.Group();
  const spin = new THREE.Group();
  tilt.add(spin);
  scene.add(tilt);

  const scale = coarse ? 3 : 4;

  interface Plate {
    def: LayerDef;
    group: THREE.Group;
    mat: THREE.ShaderMaterial;
    detail: THREE.ShaderMaterial;
    tint?: THREE.ShaderMaterial;
    edge: THREE.Mesh;
    mesh: THREE.Mesh;
  }
  const plates: Plate[] = LAYERS.map((def, i) => {
    const group = new THREE.Group();
    spin.add(group);
    const geo = keep(plateGeometry(def));
    const mat = keep(plateMaterial(keep(faceTexture(def, scale)), def.key === "top" ? 0.32 : 0.22, def.key === "top" ? 0.16 : 0.1));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 3 * i;
    group.add(mesh);
    const detail = keep(plateMaterial(keep(detailTexture(def, scale)), 0.22, 0));
    detail.uniforms.opacity.value = 0;
    const dm = new THREE.Mesh(geo, detail);
    dm.renderOrder = 3 * i + 1;
    group.add(dm);
    let tint: THREE.ShaderMaterial | undefined;
    if (def.key === "lower" || def.key === "upper") {
      tint = keep(plateMaterial(keep(tintTexture(def, scale)), 0.22, 0));
      tint.uniforms.opacity.value = 0;
      const tm = new THREE.Mesh(geo, tint);
      tm.renderOrder = 3 * i + 2;
      group.add(tm);
    }
    if (def.dots) mat.uniforms.map2.value = keep(plateDotTexture(def, scale));
    const edge = new THREE.Mesh(keep(edgeGeometry(def)), keep(solidMaterial(def.edge, def.key === "top" ? 0.9 : 1)));
    edge.visible = false;
    if (def.key === "top") (edge.material as THREE.ShaderMaterial).uniforms.rim.value = 0.22;
    group.add(edge);
    return { def, group, mat, detail, tint, edge, mesh };
  });

  /* Stand-offs: four solid posts per gap, inboard of the corners, one
     tone darker than the plates. Where a post meets a plate there is a
     counterbore (a fine light ring) and a little occlusion. Open, the
     posts simply lengthen with the gap. */
  const postMat = keep(solidMaterial("#D9DFEA", 0));
  const collarMat = keep(solidMaterial("#E6EAF2", 0.8));
  const cylGeo = keep(new THREE.CylinderGeometry(1, 1, 1, 28, 1, true));
  cylGeo.translate(0, 0.5, 0);
  cylGeo.setAttribute("vv", new THREE.Float32BufferAttribute(new Float32Array(cylGeo.attributes.position.count).fill(0.5), 1));
  const boreTex = keep(
    (() => {
      const n = 128;
      const cv = document.createElement("canvas");
      cv.width = cv.height = n;
      const g = cv.getContext("2d")!;
      const rg = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
      // Occlusion around the foot, then the counterbore's lit rim.
      // A crisp counterbore: a shadowed floor, a fine dark wall and a lit
      // rim, and nothing beyond it.
      rg.addColorStop(0, "rgba(0,20,72,0.07)");
      rg.addColorStop(0.42, "rgba(0,20,72,0.07)");
      rg.addColorStop(0.47, "rgba(0,20,72,0.22)");
      rg.addColorStop(0.52, "rgba(255,255,255,0.9)");
      rg.addColorStop(0.58, "rgba(255,255,255,0)");
      rg.addColorStop(1, "rgba(255,255,255,0)");
      g.fillStyle = rg;
      g.fillRect(0, 0, n, n);
      const t = new THREE.CanvasTexture(cv);
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    })()
  );
  const boreMat = keep(new THREE.MeshBasicMaterial({ map: boreTex, transparent: true, depthWrite: false, opacity: 0 }));
  const boreGeo = keep(new THREE.PlaneGeometry(1, 1));
  boreGeo.rotateX(-Math.PI / 2);
  const collarGeo = keep(new THREE.CylinderGeometry(1, 1, 1, 32, 1, false));
  collarGeo.translate(0, 0.5, 0);
  {
    const q = collarGeo.attributes.position;
    const vv = new Float32Array(q.count);
    for (let i = 0; i < q.count; i++) vv[i] = q.getY(i) > 0.99 ? 0 : 0.5;
    collarGeo.setAttribute("vv", new THREE.Float32BufferAttribute(vv, 1));
  }
  interface Post {
    gap: number;
    post: THREE.Mesh;
    bore: THREE.Mesh;
    foot: THREE.Mesh;
    head: THREE.Mesh;
  }
  const posts: Post[] = [];
  for (let gap = 0; gap < 3; gap++)
    for (const [x, z] of POSTS) {
      const post = new THREE.Mesh(cylGeo, postMat);
      post.position.set(x, 0, z);
      post.visible = false;
      spin.add(post);
      const bore = new THREE.Mesh(boreGeo, boreMat);
      bore.position.set(x, 0, z);
      bore.renderOrder = 3 * gap + 2;
      bore.visible = false;
      spin.add(bore);
      const mkc = () => {
        const c = new THREE.Mesh(collarGeo, collarMat);
        c.position.set(x, 0, z);
        c.visible = false;
        spin.add(c);
        return c;
      };
      posts.push({ gap, post, bore, foot: mkc(), head: mkc() });
    }

  const ground = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(1.5, 1.5)),
    keep(new THREE.MeshBasicMaterial({ map: keep(groundTexture()), transparent: true, depthWrite: false, opacity: 0 }))
  );
  ground.rotation.x = -Math.PI / 2;
  ground.renderOrder = -1;
  spin.add(ground);

  /* ── the trace (open only) ── */
  const threadMat = keep(
    new THREE.MeshBasicMaterial({ color: "#174E9E", transparent: true, opacity: 0, depthWrite: true, side: THREE.DoubleSide })
  );
  const thread = new THREE.Group();
  thread.position.set(TX, 0, TZ);
  spin.add(thread);
  const segGeo = keep(new THREE.CylinderGeometry(1, 1, 1, 10));
  segGeo.translate(0, 0.5, 0);
  const threadSegs = [0, 1, 2].map(() => {
    const m = new THREE.Mesh(segGeo, threadMat);
    m.renderOrder = 20;
    thread.add(m);
    return m;
  });

  /* Marks: discs facing the camera at a fixed CSS size, so they stay
     round from every angle: the finding's start (white, on the blue),
     a dot where the thread crosses each lane, and the landing on the
     evidence (a filled disc with one thin ring). */
  interface Mark {
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
    plate: number;
    /** Radius in CSS px. */
    r: number;
    peak: number;
    /** When it appears: thread progress 0…3, or -1 for "once open". */
    at: number;
  }
  const discGeo = keep(new THREE.CircleGeometry(1, 40));
  const ringGeo = keep(new THREE.RingGeometry(1 - 1 / 6, 1, 64));
  const marks: Mark[] = [];
  const addMark = (plate: number, geo: THREE.BufferGeometry, color: string, r: number, peak: number, at: number) => {
    const mat = keep(new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0, depthWrite: false }));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 30;
    mesh.visible = false;
    scene.add(mesh);
    marks.push({ mesh, mat, plate, r, peak, at });
  };
  addMark(3, discGeo, "#FFFFFF", 2.6, 0.92, -1);
  addMark(2, discGeo, "#234D9E", 2.2, 0.95, 0.85);
  addMark(1, discGeo, "#234D9E", 2.2, 0.95, 1.85);
  addMark(0, discGeo, "#4E8EFF", 2.6, 1, 2.8);
  addMark(0, ringGeo, "#4E8EFF", 6.5, 0.6, 2.8);
  const markPos = new THREE.Vector3();

  /* ── state ─────────────────────────────────────────── */
  let yaw = REST_YAW;
  let elev = REST_ELEV;
  let vYaw = 0;
  let vElev = 0;
  let tElev = REST_ELEV;
  let open = 0;
  let openTarget = 0;
  let reportedOpen = false;
  let focusOpen = false;
  let hoverOpen = false;
  let pinnedOpen = false;
  /** 0 = the bare mark (first frame, poster) … 1 = the made object. */
  let alive = 0;
  const t0 = performance.now();
  /** Turntable held still, and `alive` held, by the test hooks. */
  let frozen = false;
  let aliveHold: number | null = null;
  let threadT = 0;
  let prevWall = performance.now();
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;

  let hoveredKey: PartKey | null = null;
  const lift: Record<PartKey, number> = { base: 0, lower: 0, upper: 0, top: 0 };

  let dragging = false;
  let pointerInside = false;
  /** Where an opening eases the yaw so no peg eclipses the thread. */
  let clearYaw: number | null = null;
  /** Fastest spin a fling may start, rad/s. */
  const V_MAX = 7;
  let active = false;
  let raf = 0;
  let dead = false;
  let W = 0;
  let pxPerUnit = 300;

  function layout() {
    const sr = host.getBoundingClientRect();
    const cr = canvas.getBoundingClientRect();
    if (!sr.width || !sr.height || !cr.width || !cr.height) return;
    W = cr.width;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(cr.width, cr.height, false);
    const s = Math.min(sr.width, sr.height) / (2 * framing.hx);
    pxPerUnit = s;
    const stageMid = sr.top + sr.height / 2;
    camera.left = -(cr.width / 2) / s;
    camera.right = cr.width / 2 / s;
    camera.top = framing.cy + (stageMid - cr.top) / s;
    camera.bottom = camera.top - cr.height / s;
    camera.updateProjectionMatrix();
  }

  function restYawNear(a: number) {
    const k = Math.round((a - REST_YAW) / (2 * Math.PI));
    return REST_YAW + k * 2 * Math.PI;
  }

  /** How far the object is from the bare mark: alive, open or turned. */
  function away() {
    const dy = Math.abs(yaw - restYawNear(yaw));
    const de = Math.abs(elev - REST_ELEV);
    const turned = Math.max(dy - 0.02, 0) / 0.33;
    const tilted = Math.max(de - 0.02, 0) / 0.18;
    return clamp(Math.max(easeInOut(open), turned, tilted), 0, 1);
  }

  function arrange() {
    // Construction: present away from the logo pose (fully by ~15° of
    // turn, or tilt, or opening), and gone again whenever it passes the
    // pose, so the mark is always exactly the mark there.
    const dYaw = Math.abs(yaw - restYawNear(yaw));
    // Through the pose it eases down to 30% (never to paper: that reads
    // as a glitch), so only the first frame and the poster are the bare
    // mark; `alive` brings the 30% in as the turn starts.
    const A = Math.max(
      0.3 * alive + 0.7 * easeInOut(clamp(dYaw / 0.52, 0, 1)),
      easeInOut(clamp(Math.abs(elev - REST_ELEV) / 0.12, 0, 1)),
      easeInOut(clamp(open / 0.6, 0, 1))
    );
    const steep = clamp((elev - REST_ELEV) / (ELEV_MAX - REST_ELEV), 0, 1);
    const spread = OPEN * (1 - 0.45 * steep);
    const eAt = (i: number) => easeInOut(clamp(open * 1.24 - (3 - i) * 0.08, 0, 1));
    const extra = (i: number) => i * PITCH * spread * eAt(i);
    const sink = 0.35 * extra(3);
    const focus = hoveredKey ? clamp(lift[hoveredKey] / 0.035, 0, 1) : 0;
    const th = THICK.map((t) => t * A);
    const ys: number[] = [];
    plates.forEach(({ def, group, mat, detail, tint, edge }, i) => {
      const y = i * PITCH + extra(i) - sink + lift[def.key];
      group.position.y = y;
      ys.push(y);
      const dim = hoveredKey && hoveredKey !== def.key && def.key !== "top" ? focus : 0;
      mat.uniforms.lift.value = lift[def.key] / 0.035;
      mat.uniforms.dim.value = dim;
      // Detail: present once alive, full strength as the stack opens.
      // Square-on to a plate edge (45° and 135° from the pose, where the
      // stack shows as an elevation) the lane recesses would read as
      // drawer fronts: they soften to half there.
      const boxView = Math.abs(Math.sin(2 * (yaw - REST_YAW)));
      const kBox = clamp((boxView - 0.6) / 0.35, 0, 1);
      const side = def.key === "lower" || def.key === "upper" ? 1 - 0.5 * kBox * kBox * (3 - 2 * kBox) * (1 - eAt(i)) : 1;
      const dOp = Math.max(A * (def.key === "top" ? 0.85 : 0.55) * side, eAt(i));
      detail.uniforms.opacity.value = dOp;
      detail.uniforms.lift.value = lift[def.key] / 0.035;
      if (tint) tint.uniforms.lift.value = lift[def.key] / 0.035;
      edge.visible = th[i] > 1e-5;
      edge.scale.y = Math.max(th[i], 1e-5);
    });

    // Stand-offs, gap by gap.
    const r = A;
    boreMat.opacity = r;
    for (const p of posts) {
      const vis = r > 0.001;
      p.post.visible = p.bore.visible = p.foot.visible = p.head.visible = vis;
      if (!vis) continue;
      // A peg seated in a socket in the plate below and fixed into the
      // underside of the plate above, in every state: its length is the
      // live gap (it runs a hair into both plates, which hide the ends).
      const lo = ys[p.gap];
      const hi = ys[p.gap + 1] - th[p.gap + 1];
      const SEAT = 0.003;
      p.post.position.y = lo - SEAT;
      p.post.scale.set(POST_R * r, Math.max(1e-4, hi - lo + 2 * SEAT), POST_R * r);
      // Socket rim on the plate below, collar under the plate above.
      p.foot.position.y = lo;
      p.foot.scale.set(POST_R * 1.45 * r, 0.004 * r + 1e-5, POST_R * 1.45 * r);
      p.head.position.y = hi - 0.008 * r;
      p.head.scale.set(POST_R * 1.6 * r, 0.008 * r + 1e-5, POST_R * 1.6 * r);
      p.bore.position.y = lo + 0.0004;
      const br = POST_R * 2.6 * r;
      p.bore.scale.set(br, 1, br);
    }

    ground.position.y = -th[0] - 0.012 - sink;
    const a = away();
    (ground.material as THREE.MeshBasicMaterial).opacity = Math.max(A, a);
    plates[0].mat.uniforms.mix2.value = a;

    // The thread: once the stack has opened, one finding is traced down
    // from the assessment through a cross-check lane and a module lane to
    // the one piece of evidence it rests on.
    const tp = threadT * 3;
    threadMat.opacity = Math.min(1, threadT * 6) * (open > 0 ? 0.85 : 0);
    thread.visible = threadT > 0.001;
    for (let k = 0; k < 3; k++) {
      const top = ys[3 - k] - th[3 - k] - 0.001;
      const bottom = ys[2 - k] + 0.001;
      const f = clamp(tp - k, 0, 1);
      const seg = threadSegs[k];
      seg.visible = f > 0;
      seg.position.y = top;
      seg.scale.y = -Math.max(0.0001, (top - bottom) * f);
      // 2 CSS px across, whatever the stage size.
      seg.scale.x = seg.scale.z = 1 / Math.max(1, pxPerUnit);
    }
    // Lanes light as the thread reaches them.
    plates[2].tint!.uniforms.opacity.value = 0.09 * clamp((tp - 1) / 0.6, 0, 1);
    plates[1].tint!.uniforms.opacity.value = 0.09 * clamp((tp - 2) / 0.6, 0, 1);

    spin.updateMatrixWorld(true);
    for (const m of marks) {
      const a2 = m.at < 0 ? clamp((open - 0.55) / 0.35, 0, 1) : clamp((tp - m.at) / 0.25, 0, 1) * (open > 0 ? 1 : 0);
      m.mesh.visible = a2 > 0.001;
      if (!m.mesh.visible) continue;
      m.mat.opacity = a2 * m.peak;
      markPos.set(TX, ys[m.plate] + 0.0005, TZ);
      spin.localToWorld(markPos);
      m.mesh.position.copy(markPos);
      m.mesh.position.z += 0.04;
      const rr = m.r / Math.max(1, pxPerUnit);
      m.mesh.scale.set(rr, rr, 1);
    }
  }

  function render() {
    tilt.rotation.x = elev;
    spin.rotation.y = yaw;
    tilt.position.y = Math.SQRT1_2 * (Math.sin(elev) - SIN_E);
    arrange();
    renderer.render(scene, camera);
    // Development only: the capture harness can record frames straight
    // from the drawing buffer. Stripped from production builds.
    if (process.env.NODE_ENV !== "production") {
      const rec = (window as unknown as { __heroRec?: { t: number; url: string }[] }).__heroRec;
      if (rec && rec.length < 300) rec.push({ t: performance.now(), url: canvas.toDataURL("image/png") });
    }
  }

  /* ── picking ── */
  /* Hit zones. Not the animated meshes: each layer's footprint (padded)
     at the height and tilt the stack is HEADING to, without the hover
     lift, so a plate moving or lifting under the pointer never changes
     what is under it. The yaw is the live one (it holds still while the
     pointer is over the object). */
  const zm = new THREE.Matrix4();
  const zr = new THREE.Matrix4();
  const zo = new THREE.Vector3();
  const zd = new THREE.Vector3();
  function zoneHits(clientX: number, clientY: number) {
    const r = canvas.getBoundingClientRect();
    const nx = ((clientX - r.left) / r.width) * 2 - 1;
    const ny = -((clientY - r.top) / r.height) * 2 + 1;
    // Orthographic: the ray starts on the near plane and runs into -z.
    zo.set(nx, ny, -1).unproject(camera);
    zd.set(0, 0, -1);
    const eW = clamp(tElev + (openTarget ? OPEN_ELEV - REST_ELEV : 0), ELEV_MIN, ELEV_MAX);
    zm.makeTranslation(0, Math.SQRT1_2 * (Math.sin(eW) - SIN_E), 0);
    zm.multiply(zr.makeRotationX(eW));
    zm.multiply(zr.makeRotationY(yaw));
    zr.copy(zm).invert();
    zo.applyMatrix4(zr);
    zd.transformDirection(zr);
    const steep = clamp((eW - REST_ELEV) / (ELEV_MAX - REST_ELEV), 0, 1);
    const o = openTarget ? 1 : 0;
    const extra = (i: number) => i * PITCH * OPEN * (1 - 0.45 * steep) * o;
    const sink = 0.35 * extra(3);
    const out: { i: number; x: number; z: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const y = i * PITCH + extra(i) - sink;
      const t = (y - zo.y) / zd.y;
      out.push({ i, x: zo.x + zd.x * t, z: zo.z + zd.z * t });
    }
    return out; // nearest (top) first
  }
  const inZone = (h: { x: number; z: number }, pad: number) => Math.max(Math.abs(h.x), Math.abs(h.z)) <= 0.5 + pad;
  /** The layer under the pointer. With `sticky`, the current layer is
      kept until the pointer is clearly inside another one: it holds out
      to a generous margin, and a new layer must be entered past a margin
      inside its edge. */
  function pickAt(clientX: number, clientY: number, sticky = false): PartId | null {
    const hits = zoneHits(clientX, clientY);
    const top = hits.find((h) => inZone(h, 0.015));
    if (sticky && hoveredKey) {
      const cur = hits.find((h) => plates[h.i].def.key === hoveredKey)!;
      if (inZone(cur, 0.06)) {
        // Only a layer in front of the current one, entered well inside
        // its edge, takes over.
        const front = hits.find((h) => h.i > cur.i && inZone(h, -0.04));
        return { kind: (front ? plates[front.i] : plates[cur.i]).def.key };
      }
    }
    if (top) return { kind: plates[top.i].def.key };
    // In the air between two plates' edges, the nearest plate keeps the
    // name (the current one first), so passing a gap never drops it.
    const out = (h: { x: number; z: number }) => Math.max(Math.abs(h.x), Math.abs(h.z)) - 0.5;
    if (sticky && hoveredKey) {
      const cur = hits.find((h) => plates[h.i].def.key === hoveredKey)!;
      if (out(cur) < 0.16) return { kind: hoveredKey };
    }
    const near = hits.reduce((a, h) => (out(h) < out(a) ? h : a));
    return out(near) < 0.12 ? { kind: plates[near.i].def.key } : null;
  }
  let lastPX = 0;
  let lastPY = 0;
  function setHover(part: PartId | null) {
    const k = part ? part.kind : null;
    if (k === hoveredKey) return;
    hoveredKey = k;
    opts.onPart(part);
  }

  /* ── input ── */
  const samples: { t: number; x: number; y: number }[] = [];
  let downX = 0;
  let downY = 0;
  let downT = 0;
  let pid = -1;
  let touchMode: "pending" | "rotate" | "none" = "none";
  const perPx = () => 0.0062 * (480 / clamp(W, 280, 640));

  function onDown(e: PointerEvent) {
    if (e.button !== 0) return;
    pid = e.pointerId;
    downX = e.clientX;
    downY = e.clientY;
    downT = performance.now();
    samples.length = 0;
    samples.push({ t: downT, x: e.clientX, y: e.clientY });
    if (e.pointerType === "mouse" || e.pointerType === "pen") {
      dragging = true;
      vYaw = vElev = 0;
      opts.onDrag(true);
      canvas.setPointerCapture(pid);
      host.classList.add("is-grabbing");
    } else {
      touchMode = "pending";
    }
    wake();
  }

  function onMove(e: PointerEvent) {
    if (e.pointerType === "mouse" && !dragging) {
      pointerInside = true;
      lastPX = e.clientX;
      lastPY = e.clientY;
      setHover(openTarget && open > 0.5 ? pickAt(e.clientX, e.clientY, true) : null);
      wake();
      return;
    }
    if (e.pointerId !== pid) return;
    if (touchMode === "pending") {
      const dx = Math.abs(e.clientX - downX);
      const dy = Math.abs(e.clientY - downY);
      if (dx > 6 && dx > dy * 1.2) {
        touchMode = "rotate";
        dragging = true;
        vYaw = vElev = 0;
        opts.onDrag(true);
        try {
          canvas.setPointerCapture(pid);
        } catch {}
      } else if (dy > 6) {
        touchMode = "none";
        return;
      } else return;
    }
    if (!dragging) return;
    const last = samples[samples.length - 1];
    const dx = e.clientX - last.x;
    const dy = e.clientY - last.y;
    const now = performance.now();
    samples.push({ t: now, x: e.clientX, y: e.clientY });
    while (samples.length > 2 && now - samples[0].t > 90) samples.shift();
    const k = perPx();
    yaw += dx * k;
    if (touchMode !== "rotate") {
      const next = elev + dy * k;
      elev += dy * k * (next < ELEV_MIN || next > ELEV_MAX ? 0.3 : 1);
      elev = clamp(elev, ELEV_MIN - GIVE, ELEV_MAX + GIVE);
    }
    wake();
  }

  function onUp(e: PointerEvent) {
    if (e.pointerId !== pid) return;
    const now = performance.now();
    const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
    if (dragging && !reduce && samples.length > 1) {
      const a = samples[0];
      const b = samples[samples.length - 1];
      const dt = Math.max(16, b.t - a.t);
      if (now - b.t < 60) {
        const k = perPx();
        vYaw = clamp(((b.x - a.x) / dt) * 1000 * k, -V_MAX, V_MAX);
        vElev = touchMode === "rotate" ? 0 : clamp(((b.y - a.y) / dt) * 1000 * k, -V_MAX, V_MAX);
      }
    }
    if (dragging && reduce) {
      // No motion of its own: back to the mark at once.
      yaw = REST_YAW;
      elev = REST_ELEV;
      vYaw = vElev = 0;
    }
    // Touch: a tap on the object opens it and names the layer under the
    // finger; a tap beside it closes it.
    if (e.pointerType !== "mouse" && moved < 6 && now - downT < 500) {
      const part = pickAt(e.clientX, e.clientY);
      if (!part) {
        pinnedOpen = false;
        setHover(null);
      } else {
        if (!pinnedOpen) pinnedOpen = true;
        setHover(hoveredKey === part.kind ? null : part);
      }
    }
    dragging = false;
    touchMode = "none";
    pid = -1;
    host.classList.remove("is-grabbing");
    opts.onDrag(false);
    try {
      canvas.releasePointerCapture(e.pointerId);
    } catch {}
    wake();
  }

  function onCancel(e: PointerEvent) {
    if (e.pointerId !== pid) return;
    if (dragging) opts.onDrag(false);
    dragging = false;
    touchMode = "none";
    pid = -1;
    host.classList.remove("is-grabbing");
    wake();
  }

  function onEnter(e: PointerEvent) {
    if (e.pointerType !== "mouse") return;
    pointerInside = true;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      hoverOpen = true;
      wake();
    }, 120);
    wake();
  }
  function onLeave(e: PointerEvent) {
    if (e.pointerType !== "mouse") return;
    clearTimeout(hoverTimer);
    pointerInside = false;
    hoverOpen = false;
    if (!dragging) setHover(null);
    wake();
  }

  canvas.addEventListener("pointerdown", onDown);
  canvas.addEventListener("pointermove", onMove);
  canvas.addEventListener("pointerup", onUp);
  canvas.addEventListener("pointercancel", onCancel);
  canvas.addEventListener("pointerenter", onEnter);
  canvas.addEventListener("pointerleave", onLeave);
  canvas.addEventListener("lostpointercapture", onCancel);

  /* ── loop ── */
  let prev = performance.now();
  let settled = false;
  /** The canvas fades in over the poster for .6 s; the object starts to
      come alive just after, so the crossfade is between identical frames. */
  const ALIVE_AT = 900;
  const ALIVE_FOR = 1600;

  function step(now: number) {
    const dt = clamp((now - prev) / 1000, 0, 0.05);
    prev = now;
    const wall = clamp((now - prevWall) / 1000, 0, 0.5);
    prevWall = now;

    openTarget = hoverOpen || focusOpen || pinnedOpen ? 1 : 0;
    if ((openTarget === 1) !== reportedOpen) {
      reportedOpen = openTarget === 1;
      opts.onOpen(reportedOpen);
    }
    if (reduce) open = openTarget;
    else if (frozen) {
      // Test hook: hold whatever opening was posed.
    } else {
      const sp = dt / 0.5;
      open = open < openTarget ? Math.min(openTarget, open + sp) : Math.max(openTarget, open - sp);
    }

    // Coming alive: once, after the poster crossfade. Under reduced
    // motion the object stays the bare mark until someone handles it.
    if (aliveHold !== null) alive = aliveHold;
    else if (!reduce) alive = easeInOut(clamp((now - t0 - ALIVE_AT) / ALIVE_FOR, 0, 1));
    else if (dragging || openTarget) alive = 1;

    const threadWant = open >= 0.98 ? 1 : 0;
    if (reduce) threadT = threadWant;
    else if (threadT < threadWant) threadT = Math.min(1, threadT + wall / 0.75);
    else if (threadT > threadWant) threadT = Math.max(0, threadT - wall / 0.15);

    if (pointerInside && !dragging && openTarget && open > 0.5) setHover(pickAt(lastPX, lastPY, true));
    let lifting = false;
    for (const k of Object.keys(lift) as PartKey[]) {
      const want = k === hoveredKey ? 0.035 : 0;
      lift[k] = reduce ? want : lift[k] + (want - lift[k]) * Math.min(1, dt * 14);
      if (Math.abs(lift[k] - want) < 1e-5) lift[k] = want;
      else lifting = true;
    }

    /* The turntable. Nobody holding, pointing at or focused on it: it
       turns, one turn in 50 s, and whatever speed a release left it with
       relaxes into that over about a second, so a fling runs on and
       blends into the turn. Pointed at, opened or focused: it comes to a
       gentle stop where it is. The tilt always returns to the mark's. */
    const idle = !reduce && !frozen && !pointerInside && !focusOpen && !pinnedOpen;
    // Opened with a peg standing right in front of the centred thread
    // (4 yaws per turn, the logo pose among them): ease the yaw ~15° to
    // the nearer clear side, on the same spring as the tilt, so the
    // thread is never eclipsed. Once per opening; never during a drag.
    if (!openTarget || dragging) clearYaw = null;
    else if (clearYaw === null && !reduce && !frozen) {
      clearYaw = yaw;
      for (const [px, pz] of POSTS) {
        const a = Math.atan2(px, pz);
        let u = yaw + a; // screen offset ∝ sin(u); in front when cos(u) > 0
        u = Math.atan2(Math.sin(u), Math.cos(u));
        if (Math.cos(u) > 0 && Math.abs(Math.sin(u)) < 0.16) {
          const want = (u >= 0 ? 1 : -1) * 0.27;
          clearYaw = yaw + (want - u);
        }
      }
    }
    let turning = false;
    const eWant = clamp(tElev + (openTarget ? OPEN_ELEV - REST_ELEV : 0), ELEV_MIN, ELEV_MAX);
    if (!dragging && reduce) elev = eWant;
    if (!dragging && !reduce) {
      const want = idle ? IDLE_W * alive : 0;
      const tau = idle ? 1.1 : 0.45;
      // On the wall clock (to 0.1 s a frame), so a slow device still turns
      // at the same pace.
      const wt = Math.min(wall, 0.1);
      if (clearYaw !== null && clearYaw !== yaw && !idle) {
        // Spring to the clear yaw (critically damped, as the tilt).
        const OMY = 3.4;
        let rem = dt;
        while (rem > 0) {
          const h = Math.min(rem, 1 / 120);
          rem -= h;
          vYaw += (-OMY * OMY * (yaw - clearYaw) - 2 * OMY * vYaw) * h;
          yaw += vYaw * h;
        }
        if (Math.abs(yaw - clearYaw) < 1e-5 && Math.abs(vYaw) < 1e-4) {
          yaw = clearYaw;
          vYaw = 0;
        }
      } else {
        vYaw += (want - vYaw) * (1 - Math.exp(-wt / tau));
        if (frozen) vYaw = 0;
        if (Math.abs(vYaw) < 1e-4 && want === 0) vYaw = 0;
        yaw += vYaw * wt;
      }
      turning = vYaw !== 0;
      // Tilt: critically damped back to the mark's elevation, or lowered
      // while open.
      const OM = 3.4;
      let rem = dt;
      while (rem > 0) {
        const h = Math.min(rem, 1 / 120);
        rem -= h;
        vElev += (-OM * OM * (elev - eWant) - 2 * OM * vElev) * h;
        elev += vElev * h;
        const lo = ELEV_MIN - GIVE;
        const hi = ELEV_MAX + GIVE;
        if (elev < lo) (elev = lo), (vElev = Math.max(vElev, 0));
        else if (elev > hi) (elev = hi), (vElev = Math.min(vElev, 0));
      }
      if (Math.abs(elev - eWant) < 1e-5 && Math.abs(vElev) < 1e-4) {
        elev = eWant;
        vElev = 0;
      }
      // Keep the angle in one turn (the object repeats every turn).
      if (yaw - REST_YAW > 2 * Math.PI) yaw -= 2 * Math.PI;
      else if (yaw - REST_YAW < -2 * Math.PI) yaw += 2 * Math.PI;
    }

    render();

    settled =
      !dragging &&
      !turning &&
      open === openTarget &&
      threadT === threadWant &&
      !lifting &&
      elev === eWant &&
      vElev === 0 &&
      (reduce || alive >= 1);
  }

  function loop(now: number) {
    if (dead) return;
    step(now);
    if (active && !settled) raf = requestAnimationFrame(loop);
    else raf = 0;
  }

  function wake() {
    if (dead || !active || raf) return;
    prev = prevWall = performance.now();
    raf = requestAnimationFrame(loop);
  }

  const ro = new ResizeObserver(() => {
    layout();
    if (!raf) render();
  });
  ro.observe(host);
  layout();

  // First frame: the bare mark at rest, which is what the poster shows.
  render();
  opts.onReady();

  return {
    setActive(on) {
      active = on;
      if (!on && coarse) {
        pinnedOpen = false;
        setHover(null);
        open = 0;
      }
      if (on) wake();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    nudge(dy, de) {
      if (reduce) yaw += dy;
      else vYaw += dy * 3;
      tElev = clamp(tElev + de, ELEV_MIN, ELEV_MAX);
      if (reduce) elev = tElev;
      alive = Math.max(alive, reduce ? 1 : alive);
      wake();
    },
    toggleOpen() {
      pinnedOpen = !pinnedOpen;
      wake();
    },
    setFocusOpen(v) {
      focusOpen = v;
      if (!v) tElev = REST_ELEV;
      wake();
    },
    pose(y, e, o, al) {
      yaw = y;
      elev = e;
      tElev = REST_ELEV;
      open = o;
      pinnedOpen = o > 0.5;
      threadT = o >= 0.98 ? 1 : 0;
      vYaw = vElev = 0;
      if (al !== undefined) alive = aliveHold = al;
      for (const k of Object.keys(lift) as PartKey[]) lift[k] = 0;
      render();
    },
    freeze(on) {
      frozen = on;
      if (on) vYaw = 0;
      else aliveHold = null;
      wake();
    },
    state() {
      return { yaw, elev, open, thread: threadT, alive, running: raf !== 0, part: hoveredKey };
    },
    dispose() {
      dead = true;
      clearTimeout(hoverTimer);
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      canvas.removeEventListener("pointerdown", onDown);
      canvas.removeEventListener("pointermove", onMove);
      canvas.removeEventListener("pointerup", onUp);
      canvas.removeEventListener("pointercancel", onCancel);
      canvas.removeEventListener("pointerenter", onEnter);
      canvas.removeEventListener("pointerleave", onLeave);
      canvas.removeEventListener("lostpointercapture", onCancel);
      for (const d of disposables) d.dispose();
      for (const m of marks) scene.remove(m.mesh);
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
