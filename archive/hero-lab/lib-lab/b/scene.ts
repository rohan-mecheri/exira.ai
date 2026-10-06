import * as THREE from "three";
import { BLEED, REST_ELEV, REST_YAW, SVG_UNIT, type Framing } from "./frame";

/* ══════════════════════════════════════════════════════════
   Designer B: "faithful and exquisite".

   At rest the render is the mark, path for path and hex for hex:
   orthographic camera, each plate un-projected from its own SVG path,
   the fill evaluated as the SVG evaluates it (a horizontal gradient in
   screen space, interpolated in sRGB), the stroke drawn from the path
   at its own width, and the dots drawn in screen space on the logo's
   own 17 x 15 user-space lattice. Every effect that is not in the mark
   is multiplied by a measure of how far the object is from rest, which
   is exactly zero at rest, and the render loop stops there.

   Off rest, the object is four sheets of satin paper:
   · the gradient is read as light, not paint. It is a field fixed in
     the room (dark to the left, lit to the right), so a turning plate
     moves through it; tilting a plate toward the key light slides it
     up its own ramp, so the palette stays the logo's while it is lit;
   · an anisotropic sheen whose grain runs along each plate, so the
     highlight pivots and sweeps as the plate spins;
   · a hairline edge that grows from nothing and catches the light;
   · soft shadows from each plate onto the one beneath;
   · the dots are the logo's lattice glued to the plate: round on
     screen at rest, printed on the paper once turned;
   · a long-lens perspective that breathes in only while turned.
   Each layer has its own springs: it lags the turn a little, the stack
   lets in a little air while moving, and it fans out on hover with a
   stagger. All of it dies out completely at rest.
   ══════════════════════════════════════════════════════════ */

const SIN_E = Math.sin(REST_ELEV); // 100/231
const COS_E = Math.cos(REST_ELEV);
const U = SVG_UNIT;

type PartKey = "base" | "lower" | "upper" | "top";
export type PartId = { kind: PartKey };

interface LayerDef {
  key: PartKey;
  d: string;
  cy: number;
  stops: [number, string][];
  stroke: string;
  strokeWidth: number;
  strokeOpacity: number;
  join: CanvasLineJoin;
  dots?: boolean;
  /** Off-rest material. */
  shade: number;
  tiltShift: number;
  sheen: number;
  sheenTint: string;
  edge: string;
  edgeShade: string;
  /** Corner radius on the plate, local units, for shadows. */
  radius: number;
}

const LAYERS: LayerDef[] = [
  {
    key: "base",
    d: "M 233.75 223.19 L 459.25 320.81 Q 462.00 322.00 459.25 323.19 L 233.75 420.81 Q 231.00 422.00 228.25 420.81 L 2.75 323.19 Q 0.00 322.00 2.75 320.81 L 228.25 223.19 Q 231.00 222.00 233.75 223.19 Z",
    cy: 322,
    stops: [
      [0, "#F9FBFF"],
      [1, "#F9FBFF"],
    ],
    stroke: "#CADBFF",
    strokeWidth: 1,
    strokeOpacity: 0.8,
    join: "miter",
    dots: true,
    shade: 0.18,
    tiltShift: 0,
    sheen: 0.3,
    sheenTint: "#FFFFFF",
    edge: "#CADBFF",
    edgeShade: "#A9C2F2",
    radius: 0.012,
  },
  {
    key: "lower",
    d: "M 235.59 149.99 L 457.41 246.01 Q 462.00 248.00 457.41 249.99 L 235.59 346.01 Q 231.00 348.00 226.41 346.01 L 4.59 249.99 Q 0.00 248.00 4.59 246.01 L 226.41 149.99 Q 231.00 148.00 235.59 149.99 Z",
    cy: 248,
    stops: [
      [0, "#E4E9F3"],
      [0.55, "#E9EDF6"],
      [1, "#F0F3F9"],
    ],
    stroke: "#FFFFFF",
    strokeWidth: 1.4,
    strokeOpacity: 1,
    join: "miter",
    shade: 0.22,
    tiltShift: 0.22,
    sheen: 0.5,
    sheenTint: "#FFFFFF",
    edge: "#FFFFFF",
    edgeShade: "#AEB9CD",
    radius: 0.02,
  },
  {
    key: "upper",
    d: "M 236.51 76.38 L 456.49 171.62 Q 462.00 174.00 456.49 176.38 L 236.51 271.62 Q 231.00 274.00 225.49 271.62 L 5.51 176.38 Q 0.00 174.00 5.51 171.62 L 225.49 76.38 Q 231.00 74.00 236.51 76.38 Z",
    cy: 174,
    stops: [
      [0, "#D6DCE9"],
      [0.55, "#DCE2ED"],
      [1, "#E3E8F2"],
    ],
    stroke: "#FFFFFF",
    strokeWidth: 1.5,
    strokeOpacity: 0.95,
    join: "miter",
    shade: 0.22,
    tiltShift: 0.22,
    sheen: 0.5,
    sheenTint: "#FFFFFF",
    edge: "#FFFFFF",
    edgeShade: "#B9C3D5",
    radius: 0.024,
  },
  {
    key: "top",
    d: "M 237.42 2.78 L 455.58 97.22 Q 462.00 100.00 455.58 102.78 L 237.42 197.22 Q 231.00 200.00 224.58 197.22 L 6.42 102.78 Q 0.00 100.00 6.42 97.22 L 224.58 2.78 Q 231.00 0.00 237.42 2.78 Z",
    cy: 100,
    stops: [
      [0, "#06307C"],
      [0.3, "#0B3785"],
      [0.55, "#234D9E"],
      [0.78, "#426EB7"],
      [1, "#6F92D7"],
    ],
    stroke: "#174E9E",
    strokeWidth: 1.25,
    strokeOpacity: 0.8,
    join: "round",
    shade: 0.3,
    tiltShift: 0.32,
    sheen: 0.26,
    sheenTint: "#B9CDF5",
    edge: "#2D5DB0",
    edgeShade: "#0B3785",
    radius: 0.028,
  },
];

/** Layer pitch: 74 SVG units on screen at rest, as a height along the
    object's up axis. */
const PITCH = (74 * U) / COS_E;
/** Extra spacing when the stack is fully open, as a fraction of PITCH. */
const OPEN = 0.42;
const SVG_W = 462;
const HALF_H = 100;
const PAD = 3;
/** Edge thickness off rest, in SVG units. */
const THICK = 1.3;

const ELEV_MIN = (-14 * Math.PI) / 180;
const ELEV_MAX = (40 * Math.PI) / 180;

export interface MountOptions {
  reduce: boolean;
  coarse: boolean;
  framing: Framing;
  onPart: (part: PartId | null) => void;
  onReady: () => void;
}

export interface HeroHandle {
  setActive(active: boolean): void;
  nudge(dyaw: number, delev: number): void;
  toggleOpen(): void;
  intro(ms: number): void;
  setFocusOpen(open: boolean): void;
  /** Test hook: pose and render one frame (springs zeroed). */
  pose(yaw: number, elev: number, open: number): void;
  state(): { yaw: number; elev: number; open: number; running: boolean; away: number; reveal: number; vRelease: number; settleTo: number };
  /** Test hook: hold the pose after release (no settle) while true. */
  hold(on: boolean): void;
  /** Test hook: run the physics at this fraction of real time. */
  timeScale(k: number): void;
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
      const x1 = n(),
        y1 = n(),
        x = n(),
        y = n();
      s.quadraticCurveTo(x1, y1, x, y);
    } else if (c === "Z") s.closePath();
  }
  return s;
}

/** SVG point → plate (x, z) that the rest camera projects onto it. */
function unproject(sx: number, sy: number, cy: number): [number, number] {
  const X = (sx - 231) * U;
  const Y = -(sy - cy) * U;
  return [(X + Y / SIN_E) / Math.SQRT2, (X - Y / SIN_E) / Math.SQRT2];
}

function plateGeometry(L: LayerDef) {
  const shape = pathShape(L.d);
  const kx = (231 + PAD) / 231;
  const ky = (HALF_H + PAD) / HALF_H;
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
    uv.setXY(i, (sx + PAD) / (SVG_W + 2 * PAD), 1 - (sy - (L.cy - HALF_H) + PAD) / (2 * HALF_H + 2 * PAD));
    nrm[i * 3 + 1] = 1;
  }
  g.setAttribute("normal", new THREE.BufferAttribute(nrm, 3));
  g.computeBoundingSphere();
  return g;
}

/** The plate's edge: a ribbon along the path from y = 0 down to y = -1
    (scaled by a uniform), normals pointing outward in the plate. */
function edgeGeometry(L: LayerDef) {
  const pts = pathShape(L.d).getPoints(24);
  // Drop the duplicated closing point.
  if (pts.length > 1 && pts[0].distanceTo(pts[pts.length - 1]) < 1e-6) pts.pop();
  const loc = pts.map((p) => unproject(p.x, p.y, L.cy));
  const n = loc.length;
  const pos: number[] = [];
  const nor: number[] = [];
  const idx: number[] = [];
  // Signed area, to orient the outward normal.
  let area = 0;
  for (let i = 0; i < n; i++) {
    const [x0, z0] = loc[i];
    const [x1, z1] = loc[(i + 1) % n];
    area += x0 * z1 - x1 * z0;
  }
  const sgn = area > 0 ? 1 : -1;
  for (let i = 0; i < n; i++) {
    const [xp, zp] = loc[(i - 1 + n) % n];
    const [xn, zn] = loc[(i + 1) % n];
    const tx = xn - xp,
      tz = zn - zp;
    const l = Math.hypot(tx, tz) || 1;
    // Outward normal in the xz plane.
    const nx = (-tz / l) * -sgn,
      nz = (tx / l) * -sgn;
    const [x, z] = loc[i];
    pos.push(x, 0, z, x, -1, z);
    nor.push(nx, 0, nz, nx, 0, nz);
  }
  for (let i = 0; i < n; i++) {
    const a = 2 * i,
      b = 2 * ((i + 1) % n);
    // Two triangles; winding fixed up below by checking the first.
    idx.push(a, a + 1, b, b, a + 1, b + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
  // Make the winding agree with the outward normal (front faces out).
  const p = (k: number) => new THREE.Vector3(pos[3 * k], pos[3 * k + 1], pos[3 * k + 2]);
  const [i0, i1, i2] = idx;
  const fn = new THREE.Vector3().subVectors(p(i1), p(i0)).cross(new THREE.Vector3().subVectors(p(i2), p(i0)));
  const out = new THREE.Vector3(nor[3 * i0], 0, nor[3 * i0 + 2]);
  if (fn.dot(out) < 0) for (let k = 0; k < idx.length; k += 3) [idx[k + 1], idx[k + 2]] = [idx[k + 2], idx[k + 1]];
  g.setIndex(idx);
  g.computeBoundingSphere();
  return g;
}

/* ── the path, as data for an analytic signed distance ── */

/** The four rounded corners of a layer's path: [line end, control,
    curve end] each, in SVG units. The straight edges run between them. */
function corners(d: string): THREE.Vector2[] {
  const t = d.trim().split(/[\s,]+/);
  const pts: THREE.Vector2[] = [];
  let i = 0;
  let last = new THREE.Vector2();
  const n = () => parseFloat(t[i++]);
  while (i < t.length) {
    const c = t[i++];
    if (c === "M") last = new THREE.Vector2(n(), n());
    else if (c === "L") last = new THREE.Vector2(n(), n());
    else if (c === "Q") {
      const cp = new THREE.Vector2(n(), n());
      const e = new THREE.Vector2(n(), n());
      pts.push(last.clone(), cp, e);
      last = e;
    }
  }
  return pts;
}

function groundTexture() {
  const n = 256;
  const cv = document.createElement("canvas");
  cv.width = cv.height = n;
  const g = cv.getContext("2d")!;
  const rg = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  rg.addColorStop(0, "rgba(0,20,72,0.12)");
  rg.addColorStop(0.5, "rgba(0,20,72,0.05)");
  rg.addColorStop(1, "rgba(0,20,72,0)");
  g.fillStyle = rg;
  g.fillRect(0, 0, n, n);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ── shaders ──────────────────────────────────────────── */

const hex3 = (h: string) => {
  const c = new THREE.Color();
  c.setStyle(h, THREE.NoColorSpace); // raw sRGB components
  return new THREE.Vector3(c.r, c.g, c.b);
};

/* View space: x right, y up, camera looking down -z. */
const KEY = new THREE.Vector3(0.5, 0.62, 0.6).normalize();
const N_REST = new THREE.Vector3(0, COS_E, SIN_E);
/** The sheen's softbox, upper right and in front, in view units. */
const SOFTBOX = new THREE.Vector3(1.1, 1.9, 1.5);
/** Shadow light: close to the rest normal, a little from the right. */
/** Direction to the gradient's lamp: off to the right. Its component
    along the rest normal is chosen so that at rest it lies exactly along
    the screen's x in each plate's plane. */
const LIGHT_DIR = new THREE.Vector3(1, 0, 0).addScaledVector(N_REST, 0.55).normalize();
const SHADOW_DIR = N_REST.clone().add(new THREE.Vector3(0.16, 0.0, 0.05)).normalize();

const common = /* glsl */ `
  vec3 toLin(vec3 c) { return mix(c / 12.92, pow((c + 0.055) / 1.055, vec3(2.4)), step(0.04045, c)); }
  vec3 toSrgb(vec3 c) { c = max(c, 0.0); return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
`;

const plateVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vT;
  varying vec3 vView;
  varying vec3 vLocal;
  void main() {
    vUv = uv;
    vLocal = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vView = mv.xyz;
    vN = normalize((modelViewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);
    // The satin's grain: the plate direction that is horizontal at rest.
    vT = normalize((modelViewMatrix * vec4(0.70710678, 0.0, 0.70710678, 0.0)).xyz);
    gl_Position = projectionMatrix * mv;
  }`;

const plateFragment = /* glsl */ `
  uniform mat4 projectionMatrix;
  uniform mat4 modelViewMatrix;
  uniform vec2 uCorner[12];
  uniform vec3 uStrokeCol;
  uniform float uStrokeW;
  uniform float uStrokeA;
  uniform vec3 uStop[5];
  uniform float uOff[5];
  uniform int uN;
  uniform float uGradW;
  uniform vec3 uKey;
  uniform vec3 uNRest;
  uniform float uShade;
  uniform float uTiltShift;
  uniform float uSheen;
  uniform vec3 uSheenTint;
  uniform vec3 uSoftbox;
  uniform float uPersp;
  uniform float uCamZ;
  uniform float uFxSheen;
  uniform float uFxDots;
  uniform float uQA;     // dot lattice the plate carries (quarter turns)
  uniform float uQB;     // lattice of the rest pose it is settling into
  uniform float uQMix;
  uniform float uLift;
  // the light's footprint on this plate's plane
  uniform vec3 uCenter;
  uniform vec3 uLightDir;
  uniform float uLightD;
  uniform float uPhase;
  // the reveal: module lanes
  uniform float uLanes;
  uniform float uLaneAxis;
  uniform float uLaneAmt;
  uniform float uOpacity;
  // dots
  uniform float uDots;
  uniform float uCy;
  uniform vec2 uRes;
  uniform vec2 uHalf;     // view units per NDC unit
  uniform float uPxSvg;   // SVG units per device pixel at rest scale
  // shadow from the plate above
  uniform float uShadow;
  uniform mat4 uToUpper;
  uniform vec3 uShadowL;  // to the light, in this plate's local frame
  uniform float uUpperR;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vT;
  varying vec3 vView;
  varying vec3 vLocal;
  ${common}

  vec3 grad(float u) {
    // Past the light end, carry on along the logo's own last segment, so
    // a lit plate brightens along its ramp and never toward white or grey.
    if (u > 1.0) {
      int k = uN - 1;
      vec3 a = uStop[0], b = uStop[0];
      float oa = 0.0;
      for (int i = 1; i < 5; i++) if (i == k) { a = uStop[i - 1]; b = uStop[i]; oa = uOff[i - 1]; }
      return clamp(b + (b - a) * (min(u, 1.3) - 1.0) / max(1.0 - oa, 0.05), 0.0, 1.0);
    }
    u = max(u, 0.0);
    vec3 c = uStop[0];
    for (int i = 1; i < 5; i++) {
      if (i >= uN) break;
      float a = uOff[i - 1], b = uOff[i];
      if (u > a) c = mix(uStop[i - 1], uStop[i], clamp((u - a) / max(b - a, 1e-5), 0.0, 1.0));
    }
    return c;
  }

  const float S = 0.43290043; // 100/231
  vec2 unproj(vec2 s) {
    float X = (s.x - 231.0) * ${U.toFixed(10)};
    float Y = -(s.y - uCy) * ${U.toFixed(10)};
    return vec2(X + Y / S, X - Y / S) * 0.70710678;
  }

  // Plate point → its SVG point when the plate rests q quarter turns on.
  vec2 rotQ(vec2 p, float q) {
    float a = q * 1.57079633;
    float c = cos(a), s = sin(a);
    // three.js rotation.y: x' = x c + z s, z' = -x s + z c
    return vec2(p.x * c + p.y * s, -p.x * s + p.y * c);
  }
  vec2 proj(vec2 p) {
    float X = (p.x + p.y) * 0.70710678;
    float Y = -((p.y - p.x) * 0.70710678) * S;
    return vec2(231.0 + X / ${U.toFixed(10)}, uCy - Y / ${U.toFixed(10)});
  }
  float dotCov(vec2 here, float q, vec2 fc) {
    vec2 s = proj(rotQ(here, q));
    vec2 cell = floor(s / vec2(17.0, 15.0));
    float cov = 0.0;
    for (int j = -1; j <= 1; j++)
      for (int i = -1; i <= 1; i++) {
        vec2 c = (cell + vec2(float(i), float(j))) * vec2(17.0, 15.0) + vec2(8.5, 7.5);
        vec2 lc = rotQ(unproj(c), -q);
        vec4 clip = projectionMatrix * modelViewMatrix * vec4(lc.x, 0.0, lc.y, 1.0);
        float dScreen = length((fc - clip.xy / clip.w) * uHalf) / ${U.toFixed(10)};
        float dPlate = length(here - lc) * sqrt(S) / ${U.toFixed(10)};
        float d = mix(dScreen, dPlate, uFxDots);
        cov = max(cov, clamp((1.2 - d) / uPxSvg + 0.5, 0.0, 1.0));
      }
    return cov;
  }

  float dot2(vec2 v) { return dot(v, v); }
  // Distance to a quadratic Bézier (Inigo Quilez).
  float bezDist(vec2 pos, vec2 A, vec2 B, vec2 C) {
    vec2 a = B - A;
    vec2 b = A - 2.0 * B + C;
    vec2 c = a * 2.0;
    vec2 d = A - pos;
    float kk = 1.0 / dot(b, b);
    float kx = kk * dot(a, b);
    float ky = kk * (2.0 * dot(a, a) + dot(d, b)) / 3.0;
    float kz = kk * dot(d, a);
    float res;
    float p = ky - kx * kx;
    float p3 = p * p * p;
    float q = kx * (2.0 * kx * kx - 3.0 * ky) + kz;
    float h = q * q + 4.0 * p3;
    if (h >= 0.0) {
      h = sqrt(h);
      vec2 x = (vec2(h, -h) - q) / 2.0;
      vec2 uv = sign(x) * pow(abs(x), vec2(1.0 / 3.0));
      float t = clamp(uv.x + uv.y - kx, 0.0, 1.0);
      res = dot2(d + (c + b * t) * t);
    } else {
      float z = sqrt(-p);
      float v = acos(q / (p * z * 2.0)) / 3.0;
      float m = cos(v);
      float n = sin(v) * 1.732050808;
      vec3 t = clamp(vec3(m + m, -n - m, n - m) * z - kx, 0.0, 1.0);
      res = min(dot2(d + (c + b * t.x) * t.x), dot2(d + (c + b * t.y) * t.y));
    }
    return sqrt(res);
  }
  float segDist(vec2 p, vec2 a, vec2 b) {
    vec2 pa = p - a, ba = b - a;
    return length(pa - ba * clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0));
  }
  float side(vec2 p, vec2 a, vec2 b) { vec2 e = b - a, w = p - a; return e.x * w.y - e.y * w.x; }
  // Signed distance to the layer's path: four lines and four quadratic
  // corners, negative inside.
  float pathSd(vec2 p) {
    vec2 ctr = vec2(231.0, uCy);
    float dmin = 1e9;
    bool inside = true;
    for (int k = 0; k < 4; k++) {
      vec2 P0 = uCorner[3 * k], C = uCorner[3 * k + 1], P2 = uCorner[3 * k + 2];
      int kn = k == 3 ? 0 : k + 1;
      vec2 N0 = uCorner[3 * kn];
      dmin = min(dmin, bezDist(p, P0, C, P2));
      dmin = min(dmin, segDist(p, P2, N0));
      // Outside an edge's line: outside the shape.
      if (side(p, P2, N0) * side(ctr, P2, N0) < 0.0) inside = false;
      // Beyond a corner's chord: inside only within the curve (Loop-Blinn).
      if (side(p, P0, P2) * side(ctr, P0, P2) < 0.0) {
        float lc = side(p, P0, P2) / side(C, P0, P2);
        float l2 = side(p, P0, C) / side(P2, P0, C);
        float u = 0.5 * lc + l2;
        if (u * u - l2 > 0.0) inside = false;
      }
    }
    return inside ? -dmin : dmin;
  }

  float roundedSquare(vec2 p, float r) {
    vec2 q = abs(p) - vec2(0.5 - r);
    return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
  }

  void main() {
    // Sample the layer's picture as if the plate rested at the quarter
    // turn it is nearest to: the shape is symmetric under quarter turns,
    // and this makes every rest pose sample it texel for texel.
    float qT = uQMix > 0.5 ? uQB : uQA;
    vec2 sv = proj(rotQ(vLocal.xz, qT));
    // Analytic coverage, the way a rasteriser covers the SVG path: exact
    // at rest, and crisp at any angle or scale.
    float sd = pathSd(sv);
    float fw = max(length(vec2(dFdx(sd), dFdy(sd))), 1e-4);
    float fa = clamp(0.5 - sd / fw, 0.0, 1.0);
    float hw = 0.5 * uStrokeW;
    float sa = clamp((min(sd + 0.5 * fw, hw) - max(sd - 0.5 * fw, -hw)) / fw, 0.0, 1.0) * uStrokeA;
    vec4 st = vec4(uStrokeCol * sa, sa);
    vec3 n = normalize(vN);
    vec3 V = normalize(mix(vec3(0.0, 0.0, 1.0), normalize(vec3(0.0, 0.0, uCamZ) - vView), uPersp));
    bool under = dot(n, V) < 0.0;
    if (under) n = -n;

    // The fill: the logo's gradient read as light falling across the
    // plate's own plane from a lamp off to the right. Its isolines are
    // circles about the lamp's footprint on the plane, so they curve and
    // foreshorten with the plate. Off rest the lamp is near; at rest it
    // is infinitely far, the circles are straight lines, and u is exactly
    // the SVG's objectBoundingBox x.
    vec3 g = normalize(uLightDir - n * dot(uLightDir, n));
    float u;
    if (uLightD > 1000.0) u = (uCenter.x + dot(vView - uCenter, g)) / uGradW + 0.5;
    else u = (uCenter.x + uLightD - length(vView - (uCenter + g * uLightD))) / uGradW + 0.5;
    u += uPhase;
    if (!under) u += uTiltShift * clamp(dot(n, uKey) - dot(uNRest, uKey), -0.5, 0.4);

    // Satin: an anisotropic band along the plate's grain, from a softbox
    // up and to the right. It lifts the plate along its own ramp.
    vec3 Ls = normalize(uSoftbox - vView);
    vec3 H = normalize(Ls + V);
    float th = dot(normalize(vT), H);
    float aniso = pow(max(1.0 - th * th, 0.0), 60.0);
    float broad = pow(max(dot(n, H), 0.0), 10.0);
    float facing = smoothstep(0.0, 0.25, dot(n, Ls));
    if (!under) u += uSheen * uFxSheen * facing * (0.65 * aniso + 0.35 * broad);
    vec3 base = grad(u);

    vec3 P = st.rgb + base * fa * (1.0 - st.a);
    float A = st.a + fa * (1.0 - st.a);

    if (uDots > 0.5) {
      // The logo's dots: its 17 x 15 user-space pattern, carried by the
      // plate. Round on screen at rest, printed on the paper once turned.
      vec2 fc = (gl_FragCoord.xy / uRes) * 2.0 - 1.0;
      vec2 here = vLocal.xz;
      float cov = dotCov(here, uQA, fc);
      // Fade through, never a double lattice.
      if (uQMix > 0.0) cov = cov * max(0.0, 1.0 - 2.0 * uQMix) + dotCov(here, uQB, fc) * max(0.0, 2.0 * uQMix - 1.0);
      // From below, the paper lets its dots through, faintly.
      float da = cov * 0.5 * fa * (under ? 0.3 : 1.0);
      P = vec3(0.30588, 0.55686, 1.0) * da + P * (1.0 - da);
      A = da + A * (1.0 - da);
    }

    if (A <= 0.0) discard;
    vec3 c = P / A;

    // Lighting relative to rest: every term is zero at rest.
    vec3 lin = toLin(c);
    // Clamped, so no angle drives a sheet to grey or to white.
    float lit = 1.0 + uShade * clamp(dot(n, uKey) - dot(uNRest, uKey), -0.4, 0.3) + 0.04 * uLift;
    // Undersides: a cool bounce from the page, a few percent down at most.
    if (under) lit = 0.95;
    lin *= lit;
    if (under) lin *= vec3(0.975, 0.99, 1.0);

    // The reveal: the analytical layers' module lanes, printed into the
    // sheet as faint alternating bands with a white hairline between.
    if (uLaneAmt > 0.0 && !under) {
      vec2 lp = vLocal.xz;
      float t = (uLaneAxis > 0.5 ? lp.y : lp.x) + 0.5;
      float o = uLaneAxis > 0.5 ? lp.x : lp.y;
      float inset = 0.048;
      float inside = (1.0 - smoothstep(0.5 - inset - 0.01, 0.5 - inset, abs(o))) *
                     (1.0 - smoothstep(0.5 - inset - 0.01, 0.5 - inset, abs(t - 0.5)));
      float band = mod(floor(t * uLanes), 2.0) * 2.0 - 1.0;
      // The band runs to the plate's edge at half strength, so the inset
      // reads as a margin, not a tray.
      lin *= 1.0 + 0.045 * band * uLaneAmt * mix(0.5, 1.0, inside);
      float dl = abs(fract(t * uLanes + 0.5) - 0.5) / uLanes;
      float fwl = max(fwidth(t), 1e-5);
      float wl = 0.0028;
      float line = clamp((wl * 0.5 - dl) / fwl + 0.5, 0.0, 1.0) * clamp(wl / fwl, 0.35, 1.0);
      lin = mix(lin, vec3(1.0), 0.75 * line * uLaneAmt * inside);
    }

    // Soft shadow of the plate above.
    if (uShadow > 0.0) {
      vec4 q = uToUpper * vec4(vLocal, 1.0);
      vec3 dl = (uToUpper * vec4(uShadowL, 0.0)).xyz;
      float t = -q.y / dl.y;
      vec3 hit = q.xyz + t * dl;
      float sd = roundedSquare(hit.xz, uUpperR);
      float pen = 0.012 + 0.16 * max(t, 0.0);
      float sh = 1.0 - smoothstep(-pen, pen, sd);
      lin *= 1.0 - uShadow * sh;
    }

    // Triangular dither of about one 8-bit step, as Chrome dithers its
    // own SVG gradients, so the shallow grey ramps never band.
    vec3 outc = toSrgb(lin);
    float r1 = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
    float r2 = fract(sin(dot(gl_FragCoord.xy, vec2(39.3468, 11.135))) * 24634.6345);
    outc += (r1 + r2 - 1.0) / 255.0;
    gl_FragColor = vec4(outc * A, A) * uOpacity;
  }`;

const edgeVertex = /* glsl */ `
  uniform float uThick;
  varying vec3 vN;
  varying vec3 vView;
  varying float vDepth;
  void main() {
    vDepth = -position.y;
    vec3 p = vec3(position.x, position.y * uThick, position.z);
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vView = mv.xyz;
    vN = normalize((modelViewMatrix * vec4(normal, 0.0)).xyz);
    gl_Position = projectionMatrix * mv;
  }`;

const edgeFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform vec3 uKey;
  uniform vec3 uSoftbox;
  uniform float uAlpha;
  uniform vec3 uShadeCol;
  varying vec3 vN;
  varying vec3 vView;
  varying float vDepth;
  ${common}
  void main() {
    vec3 n = normalize(vN);
    // A rim of paper: the lit top of the edge in its own colour, the
    // underside a shade deeper, so even edge-on the sheet is a crisp line.
    vec3 col = mix(uColor, uShadeCol, smoothstep(0.2, 0.55, vDepth));
    vec3 lin = toLin(col) * min(1.0, 0.86 + 0.3 * max(dot(n, uKey), 0.0));
    vec3 Ls = normalize(uSoftbox - vView);
    vec3 H = normalize(Ls + vec3(0.0, 0.0, 1.0));
    lin += toLin(uColor) * 0.6 * pow(max(dot(n, H), 0.0), 18.0);
    gl_FragColor = vec4(toSrgb(lin) * uAlpha, uAlpha);
  }`;

/* The reveal's marks: hairlines and points, expanded in screen space
   so they are exactly as wide as asked at any angle, with round ends. */
const markVertex = /* glsl */ `
  uniform vec3 uA;
  uniform vec3 uB;
  uniform float uW;
  uniform vec2 uRes;
  attribute vec2 corner;
  varying vec2 vPix;
  varying vec2 vSa;
  varying vec2 vSb;
  void main() {
    vec4 ca = projectionMatrix * viewMatrix * vec4(uA, 1.0);
    vec4 cb = projectionMatrix * viewMatrix * vec4(uB, 1.0);
    vec2 sa = ca.xy / ca.w * uRes * 0.5;
    vec2 sb = cb.xy / cb.w * uRes * 0.5;
    vec2 d = sb - sa;
    float L = length(d);
    vec2 dir = L > 1e-3 ? d / L : vec2(1.0, 0.0);
    vec2 nr = vec2(-dir.y, dir.x);
    float r = uW * 0.5 + 1.0;
    vec2 p = mix(sa - dir * r, sb + dir * r, corner.x) + nr * corner.y * r;
    vPix = p; vSa = sa; vSb = sb;
    gl_Position = vec4(p / (uRes * 0.5), 0.0, 1.0);
  }`;
const markFragment = /* glsl */ `
  uniform vec3 uColor;
  uniform float uAlpha;
  uniform float uW;
  varying vec2 vPix;
  varying vec2 vSa;
  varying vec2 vSb;
  void main() {
    vec2 pa = vPix - vSa, ba = vSb - vSa;
    float h = dot(ba, ba) > 1e-6 ? clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0) : 0.0;
    float d = length(pa - ba * h);
    float a = clamp(uW * 0.5 - d + 0.5, 0.0, 1.0) * uAlpha;
    if (a <= 0.0) discard;
    gl_FragColor = vec4(uColor * a, a);
  }`;

/* ── math ─────────────────────────────────────────────── */
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const smooth01 = (x: number) => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};

interface Spring {
  x: number;
  v: number;
}
const sp = (): Spring => ({ x: 0, v: 0 });
/** Damped spring toward `to`, semi-implicit, sub-stepped. */
function springStep(s: Spring, to: number, w: number, z: number, dt: number) {
  const n = Math.max(1, Math.ceil(dt / (1 / 240)));
  const h = dt / n;
  for (let i = 0; i < n; i++) {
    s.v += (-2 * z * w * s.v - w * w * (s.x - to)) * h;
    s.x += s.v * h;
  }
}
const springRest = (s: Spring, to: number, eps = 1e-5) => Math.abs(s.x - to) < eps && Math.abs(s.v) < eps * 10;

export function mount(host: HTMLElement, opts: MountOptions): HeroHandle {
  const { reduce, coarse, framing } = opts;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, premultipliedAlpha: true, powerPreference: "high-performance" });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NoToneMapping;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  const CAM_Z = 3.2;
  const scene = new THREE.Scene();
  const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 20);
  camera.position.set(0, 0, CAM_Z);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  const orthoM = new THREE.Matrix4();
  const perspM = new THREE.Matrix4();
  const blendM = new THREE.Matrix4();

  const scale = coarse ? 3 : 4;

  interface Plate {
    def: LayerDef;
    i: number;
    root: THREE.Group; // screen-space parallax
    tilt: THREE.Group;
    spin: THREE.Group;
    lift: THREE.Group; // height in the stack
    lag: THREE.Group; // the layer's own lag rotation
    face: THREE.Mesh;
    edge: THREE.Mesh;
    mat: THREE.ShaderMaterial;
    edgeMat: THREE.ShaderMaterial;
    open: Spring;
    lagY: Spring;
    lagE: Spring;
    hov: Spring;
    px: Spring;
    py: Spring;
  }

  const uHalf = new THREE.Vector2(1, 1);
  const uRes = new THREE.Vector2(1, 1);
  const uPx = { value: 1 };

  const plates: Plate[] = LAYERS.map((def, i) => {
    const root = new THREE.Group();
    const tilt = new THREE.Group();
    const spin = new THREE.Group();
    const lift = new THREE.Group();
    const lag = new THREE.Group();
    root.add(tilt);
    tilt.add(spin);
    spin.add(lift);
    lift.add(lag);
    scene.add(root);
    const stops = def.stops.map(([, c]) => hex3(c));
    const offs = def.stops.map(([o]) => o);
    while (stops.length < 5) {
      stops.push(stops[stops.length - 1].clone());
      offs.push(1);
    }
    const mat = keep(
      new THREE.ShaderMaterial({
        uniforms: {
          uCorner: { value: corners(def.d) },
          uStrokeCol: { value: hex3(def.stroke) },
          uStrokeW: { value: def.strokeWidth },
          uStrokeA: { value: def.strokeOpacity },
          uStop: { value: stops },
          uOff: { value: offs },
          uN: { value: def.stops.length },
          uGradW: { value: SVG_W * U },
          uKey: { value: KEY },
          uNRest: { value: N_REST },
          uShade: { value: def.shade },
          uTiltShift: { value: def.tiltShift },
          uSheen: { value: def.sheen },
          uSheenTint: { value: hex3(def.sheenTint) },
          uSoftbox: { value: SOFTBOX },
          uPersp: { value: 0 },
          uCamZ: { value: CAM_Z },
          uFxSheen: { value: 0 },
          uCenter: { value: new THREE.Vector3() },
          uLightDir: { value: LIGHT_DIR },
          uLightD: { value: 1e5 },
          uPhase: { value: 0 },
          uLanes: { value: def.key === "lower" ? 6 : 5 },
          uLaneAxis: { value: def.key === "lower" ? 1 : 0 },
          uLaneAmt: { value: 0 },
          uFxDots: { value: 0 },
          uQA: { value: 0 },
          uQB: { value: 0 },
          uQMix: { value: 0 },
          uLift: { value: 0 },
          uOpacity: { value: 1 },
          uDots: { value: def.dots ? 1 : 0 },
          uCy: { value: def.cy },
          uRes: { value: uRes },
          uHalf: { value: uHalf },
          uPxSvg: uPx,
          uShadow: { value: 0 },
          uToUpper: { value: new THREE.Matrix4() },
          uShadowL: { value: new THREE.Vector3(0, 1, 0) },
          uUpperR: { value: 0.02 },
        },
        vertexShader: plateVertex,
        fragmentShader: plateFragment,
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
        depthTest: false,
        side: THREE.DoubleSide,
      })
    );
    const face = new THREE.Mesh(keep(plateGeometry(def)), mat);
    face.frustumCulled = false;
    const edgeMat = keep(
      new THREE.ShaderMaterial({
        uniforms: {
          uThick: { value: 0 },
          uColor: { value: hex3(def.edge) },
          uShadeCol: { value: hex3(def.edgeShade) },
          uKey: { value: KEY },
          uSoftbox: { value: SOFTBOX },
          uAlpha: { value: 1 },
        },
        vertexShader: edgeVertex,
        fragmentShader: edgeFragment,
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
        depthTest: false,
        side: THREE.FrontSide,
      })
    );
    const edge = new THREE.Mesh(keep(edgeGeometry(def)), edgeMat);
    edge.frustumCulled = false;
    edge.visible = false;
    lag.add(edge);
    lag.add(face);
    return { def, i, root, tilt, spin, lift, lag, face, edge, mat, edgeMat, open: sp(), lagY: sp(), lagE: sp(), hov: sp(), px: sp(), py: sp() };
  });

  // Ground: a soft falloff under the base, only while away from rest.
  const groundRoot = new THREE.Group();
  const groundTilt = new THREE.Group();
  const groundSpin = new THREE.Group();
  groundRoot.add(groundTilt);
  groundTilt.add(groundSpin);
  scene.add(groundRoot);
  const groundMat = keep(new THREE.MeshBasicMaterial({ map: keep(groundTexture()), transparent: true, depthWrite: false, depthTest: false, opacity: 0 }));
  const ground = new THREE.Mesh(keep(new THREE.PlaneGeometry(1.9, 1.9)), groundMat);
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.07;
  ground.renderOrder = -10;
  ground.frustumCulled = false;
  ground.visible = false;
  groundSpin.add(ground);

  /* ── the reveal ──────────────────────────────────────
     Open the stack and it says what Exira does, with nothing but the
     mark's own vocabulary: the two analytical layers show their lanes
     (six and five, the eleven modules, crossing each other); three
     hairlines tie a lane of one to a lane of the other (checked against
     each other); and three of the evidence layer's own dots rise through
     the stack and stop under the blue (only findings come out). Drawn
     once on the wall clock, then still. */
  const markGeo = keep(new THREE.BufferGeometry());
  markGeo.setAttribute("position", new THREE.Float32BufferAttribute(new Float32Array(12), 3));
  markGeo.setAttribute("corner", new THREE.Float32BufferAttribute([0, -1, 1, -1, 1, 1, 0, 1], 2));
  markGeo.setIndex([0, 1, 2, 0, 2, 3]);
  function mark(color: string, w: number) {
    const m = keep(
      new THREE.ShaderMaterial({
        uniforms: {
          uA: { value: new THREE.Vector3() },
          uB: { value: new THREE.Vector3() },
          uW: { value: w },
          uRes: { value: uRes },
          uColor: { value: hex3(color) },
          uAlpha: { value: 0 },
        },
        vertexShader: markVertex,
        fragmentShader: markFragment,
        transparent: true,
        premultipliedAlpha: true,
        depthWrite: false,
        depthTest: false,
      })
    );
    const mesh = new THREE.Mesh(markGeo, m);
    mesh.frustumCulled = false;
    mesh.visible = false;
    scene.add(mesh);
    return { mesh, m };
  }
  // Three of the base's own lattice dots near the front tip (SVG user
  // space), as plate points: they read in the gaps whatever the spread.
  // Three of the evidence layer's own lattice dots, scattered along the
  // front of the stack where the gaps show: one causal chain each. The
  // dot lights (evidence), a hairline climbs through a module lane to a
  // cross-check lane (checked), and a finding leaves its top and rises
  // to the blue.
  const COLUMN_SVG: [number, number][] = [
    [161.5, 352.5],
    [229.5, 397.5],
    [297.5, 367.5],
  ];
  const columns = COLUMN_SVG.map(([x, y], k) => ({
    base: unproject(x, y, 322),
    ev: mark("#4E8EFF", 0),
    check: mark("#426EB7", 1.1),
    check2: mark("#426EB7", 1.1),
    tick: mark("#426EB7", 0),
    halo: mark("#4E8EFF", 0),
    dot: mark("#4E8EFF", 0),
    k,
  }));
  const laneAmt = [0, 0];
  let revealT0 = 0;
  let revealOn = false;
  const revealFade = sp();
  const v3a = new THREE.Vector3();
  const v3b = new THREE.Vector3();

  // On touch the stack sits between the CTAs and the caption with no
  // overflow to spare, so it opens a little less.
  const openK = coarse ? 0.3 : OPEN;

  /* ── state ─────────────────────────────────────────── */
  let yaw = REST_YAW;
  let elev = REST_ELEV;
  let vYaw = 0;
  let vElev = 0;
  let mode: "idle" | "drag" | "free" | "settle" = "idle";
  let settleTo: [number, number] = [REST_YAW, REST_ELEV];
  let releaseT = 0;
  let wYaw = 0; // filtered angular velocity, for the layers' response
  let wElev = 0;
  const air = sp(); // extra spacing while moving
  const look = { y: sp(), e: sp() }; // hover look-at
  /** Engagement: 1 while held or coasting, so the material does not
      flatten each time a quarter turn passes; fades during the settle. */
  const eng = sp();
  let cursor: [number, number] | null = null;

  let focusOpen = false;
  let hoverOpen = false;
  let pinnedOpen = false;
  let introUntil = 0;
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;
  let hoveredKey: PartKey | null = null;
  let pointerInside = false;

  let active = false;
  let raf = 0;
  let dead = false;
  let W = 0;
  let awayNow = 0;
  let held = false;
  let vRelease = 0;
  let tScale = 1;
  /** Simulation clock, s: the reveal is timed on it. */
  let simT = 0;

  /* Framing is computed from the stage's own size and the canvas's
     offset within it, never from page positions: the hero's reveal
     animates a transform, and a rect read mid-animation would misplace
     the frame by a fraction of a pixel for good. */
  function layout() {
    const sr = host.getBoundingClientRect();
    const dpr = Math.min(devicePixelRatio || 1, 2);
    const sw = sr.width;
    const sh = sr.height;
    if (!sw || !sh) return;
    // The canvas: the stage plus its bleed, sized to whole device pixels
    // so the buffer is never stretched.
    const cl = -BLEED.side * sw;
    const ct = -BLEED.top * sh;
    const cw = Math.round((1 + 2 * BLEED.side) * sw * dpr) / dpr;
    const ch = Math.round((1 + BLEED.top + BLEED.bottom) * sh * dpr) / dpr;
    Object.assign(canvas.style, { left: `${cl}px`, top: `${ct}px`, width: `${cw}px`, height: `${ch}px` });
    const cr = { width: cw, height: ch };
    W = sw;
    renderer.setPixelRatio(dpr);
    renderer.setSize(cr.width, cr.height, false);
    const s = Math.min(sr.width, sr.height) / (2 * framing.hx);
    camera.left = (cl - sw / 2) / s;
    camera.right = (cl + cw - sw / 2) / s;
    camera.top = framing.cy + (sh / 2 - ct) / s;
    camera.bottom = camera.top - cr.height / s;
    camera.updateProjectionMatrix();
    orthoM.copy(camera.projectionMatrix);
    // The same frustum at the focal plane (z = 0, CAM_Z from the eye).
    const k = camera.near / CAM_Z;
    perspM.makePerspective(camera.left * k, camera.right * k, camera.top * k, camera.bottom * k, camera.near, camera.far);
    uHalf.set((camera.right - camera.left) / 2, (camera.top - camera.bottom) / 2);
    uRes.set(renderer.domElement.width, renderer.domElement.height);
    // SVG units per device pixel.
    uPx.value = 1 / (s * dpr * U);
  }

  /* The plates are square and the gradient is light, not paint, so the
     mark is the mark at every quarter turn: four detents, and a settle
     never travels more than 45°. Only the dots know which quarter they
     are in; they cross over to the target's lattice as it arrives. */
  const QT = Math.PI / 2;
  function nearestRest(y: number) {
    return REST_YAW + Math.round((y - REST_YAW) / QT) * QT;
  }
  const quarterOf = (y: number) => (((Math.round((y - REST_YAW) / QT) % 4) + 4) % 4);
  let qRest = 0; // the lattice the plate carries

  const tmpM = new THREE.Matrix4();
  const tmpV = new THREE.Vector3();
  const order: Plate[] = plates.slice();
  const depth = new Map<Plate, number>();

  function render() {
    const ry = yaw + look.y.x;
    const re = elev + look.e.x;
    const dYaw = Math.abs(ry - nearestRest(ry));
    const dElev = Math.abs(re - REST_ELEV);
    // How far from rest: turned, and open. Both exactly zero at rest.
    const turn = Math.max(smooth01(Math.max(dYaw / 0.55, dElev / 0.35)), eng.x);
    const openAvg = plates.reduce((a, p) => a + clamp(p.open.x, 0, 1.2), 0) / plates.length;
    const opened = smooth01(openAvg + air.x * 4);
    const away = Math.max(turn, opened);
    awayNow = away;

    // Dots: cross to the lattice of the rest pose being approached.
    let qTo = qRest;
    let qMix = 0;
    if (mode === "settle") {
      qTo = quarterOf(settleTo[0]);
      if (qTo !== qRest) qMix = smooth01((0.75 - Math.abs(yaw - settleTo[0])) / 0.45);
    }
    // Lift the stack as it tilts up, so its lowest tip never drops onto
    // the caption (and its top stays clear of the nav).
    const comp = re > REST_ELEV ? 0.6 * Math.SQRT1_2 * (Math.sin(re) - SIN_E) : 0;

    const persp = 0.18 * turn;
    // The lamp that makes the gradient: infinitely far at rest, near when
    // turned, so the ramp curves about its footprint on each plate.
    const lampD = turn > 1e-4 ? Math.min(1.6 / turn, 1e4) : 1e5;
    // Opening grows the stack downward as well as up (more so on touch,
    // where the CTAs sit directly above), so it never crowds the nav.
    const grow = (coarse ? 0.22 : 0.32) * 3 * PITCH * openK * Math.cos(re);
    if (persp > 0) {
      for (let k = 0; k < 16; k++) blendM.elements[k] = orthoM.elements[k] * (1 - persp) + perspM.elements[k] * persp;
      camera.projectionMatrix.copy(blendM);
    } else camera.projectionMatrix.copy(orthoM);
    camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();

    const thick = (THICK * U * away) / 1;
    for (const p of plates) {
      p.root.position.set(p.px.x, p.py.x + comp - grow * clamp(openAvg, 0, 1), 0);
      p.tilt.rotation.x = re;
      p.spin.rotation.y = ry;
      p.lift.position.y = p.i * PITCH * (1 + openK * p.open.x + air.x) + p.hov.x;
      const u = p.mat.uniforms;
      u.uLightD.value = lampD;
      // Lower sheets sit a little further down the ramp: depth, no new colour.
      u.uPhase.value = -0.035 * (3 - p.i) * turn;
      if (p.def.key === "lower" || p.def.key === "upper") u.uLaneAmt.value = laneAmt[p.def.key === "lower" ? 0 : 1];
      p.lag.rotation.set(p.lagE.x, p.lagY.x, 0);
      p.root.updateMatrixWorld(true);
      p.lag.getWorldPosition(u.uCenter.value);
      u.uCenter.value.z -= CAM_Z;
      u.uPersp.value = persp;
      u.uFxSheen.value = Math.max(turn, 0.45 * opened);
      u.uFxDots.value = 0.6 * turn;
      u.uQA.value = qRest;
      u.uQB.value = qTo;
      u.uQMix.value = qMix;
      u.uLift.value = p.hov.x / 0.02;
      p.edgeMat.uniforms.uThick.value = thick;
      p.edge.visible = thick > 1e-7;
    }
    // Shadows from each plate onto the one beneath.
    for (let i = 0; i < plates.length; i++) {
      const p = plates[i];
      const up = plates[i + 1];
      const u = p.mat.uniforms;
      const sh = up ? away * (p.def.key === "base" ? 0.08 : 0.09) : 0;
      u.uShadow.value = sh;
      if (sh > 0 && up) {
        tmpM.copy(up.lag.matrixWorld).invert().multiply(p.lag.matrixWorld);
        u.uToUpper.value.copy(tmpM);
        // The light, into this plate's local frame.
        tmpM.copy(p.lag.matrixWorld).invert();
        tmpV.copy(SHADOW_DIR).transformDirection(tmpM);
        u.uShadowL.value.copy(tmpV);
        u.uUpperR.value = up.def.radius;
      }
    }
    // Painter's order by depth: far plates first.
    for (const p of plates) depth.set(p, p.lag.getWorldPosition(tmpV).z);
    order.sort((a, b) => depth.get(a)! - depth.get(b)!);
    order.forEach((p, k) => {
      p.edge.renderOrder = 2 * k;
      p.face.renderOrder = 2 * k + 1;
    });
    // The reveal's marks, placed between the plates they pass between.
    const e = revealOn ? simT - revealT0 : 99;
    const fade = revealFade.x * smooth01((opened - 0.55) / 0.35);
    laneAmt[0] = fade * smooth01(e / 0.35);
    laneAmt[1] = fade * smooth01((e - 0.12) / 0.35);
    const pxSvg = 1 / uPx.value; // device px per SVG unit
    const ease = (x: number) => (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2);
    const faceOrder = (i: number) => plates[i].face.renderOrder;
    for (const c of columns) {
      const [x, z] = c.base;
      // Plate point in the current quarter's frame (same rule as the dots).
      const a = (-qRest * Math.PI) / 2;
      const lx = x * Math.cos(a) + z * Math.sin(a);
      const lz = -x * Math.sin(a) + z * Math.cos(a);
      const at = (i: number, out: THREE.Vector3) => out.set(lx, 0, lz).applyMatrix4(plates[i].lag.matrixWorld);
      const set = (mk: { mesh: THREE.Mesh; m: THREE.ShaderMaterial }, A: THREE.Vector3, B: THREE.Vector3, w: number, al: number, ro: number) => {
        const u = mk.m.uniforms;
        u.uA.value.copy(A);
        u.uB.value.copy(B);
        u.uW.value = w;
        u.uAlpha.value = al;
        mk.mesh.visible = al > 0.002;
        mk.mesh.renderOrder = ro;
      };
      const t0 = 0.25 + 0.16 * c.k;
      // Evidence: the base's own dot lights up.
      const ek = smooth01((e - t0) / 0.2);
      at(0, v3a);
      set(c.ev, v3a, v3a, 2 * 1.9 * pxSvg, fade * ek, faceOrder(0) + 0.6);
      // Checked: a hairline climbs from it through the module layer to
      // the cross-check layer, with a tick where it lands.
      const gk = smooth01((e - t0 - 0.15) / 0.45);
      // In two pieces, each drawn in its own gap, so the module layer
      // passes in front of the lower piece and behind the upper.
      const g = ease(gk);
      const wl = Math.max(1.2, 0.9 * pxSvg);
      const al = 0.7 * fade * Math.min(1, gk * 6);
      const p0 = at(0, new THREE.Vector3());
      const p1 = at(1, new THREE.Vector3());
      const top = at(2, new THREE.Vector3());
      const g0 = clamp(g * 2, 0, 1);
      const g1 = clamp(g * 2 - 1, 0, 1);
      set(c.check, p0, v3a.copy(p0).lerp(p1, g0), wl, al, faceOrder(0) + 0.5);
      set(c.check2, p1, v3b.copy(p1).lerp(top, g1), wl, g1 > 0 ? al : 0, faceOrder(1) + 0.5);
      set(c.tick, top, top, 2 * 1.3 * pxSvg, 0.8 * fade * smooth01((gk - 0.9) / 0.1), faceOrder(1) + 0.55);
      // Finding: leaves the hairline's top and rises to rest under the blue.
      const rk = ease(clamp((e - t0 - 0.65) / 0.7, 0, 1));
      const h = 2 / 3 + (0.84 - 2 / 3) * rk;
      const seg = 2;
      at(seg, v3a);
      at(3, v3b);
      v3a.lerp(v3b, h * 3 - seg);
      const on = fade * smooth01((e - t0 - 0.6) / 0.08);
      set(c.halo, v3a, v3a, 2 * 2.2 * 2.2 * pxSvg, 0.15 * on, faceOrder(seg) + 0.6);
      set(c.dot, v3a, v3a, 2 * 2.2 * pxSvg, 0.95 * on, faceOrder(seg) + 0.61);
    }

    // Ground, only from above.
    groundRoot.position.y = comp;
    groundTilt.rotation.x = re;
    groundSpin.rotation.y = ry;
    const gOp = away * smooth01((re - 0.05) / 0.2);
    groundMat.opacity = gOp;
    ground.visible = gOp > 1e-4;

    renderer.render(scene, camera);
  }

  /* ── picking: a ray through the blended projection ── */
  const ray = new THREE.Ray();
  const faces = plates.map((p) => p.face);
  const rc = new THREE.Raycaster();
  function pickAt(clientX: number, clientY: number): PartId | null {
    const r = canvas.getBoundingClientRect();
    const nx = ((clientX - r.left) / r.width) * 2 - 1;
    const ny = -((clientY - r.top) / r.height) * 2 + 1;
    const a = new THREE.Vector3(nx, ny, -1).applyMatrix4(camera.projectionMatrixInverse).applyMatrix4(camera.matrixWorld);
    const b = new THREE.Vector3(nx, ny, 1).applyMatrix4(camera.projectionMatrixInverse).applyMatrix4(camera.matrixWorld);
    ray.set(a, b.sub(a).normalize());
    rc.ray.copy(ray);
    const hits = rc.intersectObjects(faces, false);
    if (!hits.length) return null;
    // Nearest to the eye in the painter's order.
    let best: Plate | null = null;
    for (const h of hits) {
      const p = plates.find((q) => q.face === h.object)!;
      if (!best || order.indexOf(p) > order.indexOf(best)) best = p;
    }
    return best ? { kind: best.def.key } : null;
  }

  function setHover(part: PartId | null) {
    const k = part ? part.kind : null;
    if (k === hoveredKey) return;
    hoveredKey = k;
    opts.onPart(part);
  }

  /* ── input ── */
  const samples: { t: number; yaw: number; elev: number }[] = [];
  let downX = 0,
    downY = 0,
    downT = 0,
    lastX = 0,
    lastY = 0,
    pid = -1;
  let touchMode: "pending" | "rotate" | "none" = "none";
  const perPx = () => 0.0068 * (440 / clamp(W, 260, 640));

  function onDown(e: PointerEvent) {
    if (e.button !== 0) return;
    pid = e.pointerId;
    downX = lastX = e.clientX;
    downY = lastY = e.clientY;
    downT = performance.now();
    samples.length = 0;
    if (e.pointerType === "mouse" || e.pointerType === "pen") {
      beginDrag();
      host.setPointerCapture(pid);
    } else touchMode = "pending";
    wake();
  }
  function beginDrag() {
    mode = "drag";
    vYaw = vElev = 0;
    samples.length = 0;
    samples.push({ t: performance.now(), yaw, elev });
    host.classList.add("is-grabbing");
  }

  function onMove(e: PointerEvent) {
    if (e.pointerType === "mouse") {
      const r = host.getBoundingClientRect();
      cursor = [clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1), clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1)];
      if (mode !== "drag") setHover(pickAt(e.clientX, e.clientY));
      wake();
    }
    if (e.pointerId !== pid) return;
    if (touchMode === "pending") {
      const dx = Math.abs(e.clientX - downX);
      const dy = Math.abs(e.clientY - downY);
      if (dx > 6 && dx > dy * 1.2) {
        touchMode = "rotate";
        beginDrag();
        try {
          host.setPointerCapture(pid);
        } catch {}
      } else if (dy > 6) {
        touchMode = "none";
        return;
      } else return;
    }
    if (mode !== "drag") return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;
    const k = perPx();
    yaw += dx * k;
    if (touchMode !== "rotate") {
      const next = elev + dy * k;
      // Past the limits elevation follows at a quarter: you feel the edge.
      elev += dy * k * (next < ELEV_MIN || next > ELEV_MAX ? 0.25 : 1);
    }
    const now = performance.now();
    samples.push({ t: now, yaw, elev });
    while (samples.length > 2 && now - samples[0].t > 80) samples.shift();
    wake();
  }

  function onUp(e: PointerEvent) {
    if (e.pointerId !== pid) return;
    const now = performance.now();
    const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
    if (mode === "drag") {
      if (!reduce && samples.length > 1) {
        const a = samples[0];
        const b = samples[samples.length - 1];
        const dt = Math.max(0.016, (b.t - a.t) / 1000);
        if (now - b.t < 70) {
          vRelease = (b.yaw - a.yaw) / dt;
          vYaw = clamp(vRelease, -9, 9);
          vElev = touchMode === "rotate" ? 0 : (b.elev - a.elev) / dt;
        }
      }
      mode = "free";
      releaseT = now;
    }
    if (e.pointerType !== "mouse" && moved < 8 && now - downT < 500) {
      // A tap opens or closes the stack and names the layer.
      const part = pickAt(e.clientX, e.clientY);
      pinnedOpen = !pinnedOpen;
      setHover(pinnedOpen ? part : null);
    }
    touchMode = "none";
    pid = -1;
    host.classList.remove("is-grabbing");
    try {
      host.releasePointerCapture(e.pointerId);
    } catch {}
    wake();
  }
  function onCancel(e: PointerEvent) {
    if (e.pointerId !== pid) return;
    if (mode === "drag") {
      mode = "free";
      releaseT = performance.now();
    }
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
    }, 110);
  }
  function onLeave(e: PointerEvent) {
    if (e.pointerType !== "mouse") return;
    clearTimeout(hoverTimer);
    pointerInside = false;
    hoverOpen = false;
    cursor = null;
    if (mode !== "drag") setHover(null);
    wake();
  }

  host.addEventListener("pointerdown", onDown);
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerup", onUp);
  host.addEventListener("pointercancel", onCancel);
  host.addEventListener("pointerenter", onEnter);
  host.addEventListener("pointerleave", onLeave);
  host.addEventListener("lostpointercapture", onCancel);

  /* ── simulation ── */
  const FRICTION = 2.1; // 1/s
  const SETTLE_AFTER = 0.9; // s after release
  let prev = performance.now();
  let prevYaw = yaw;
  let prevElev = elev;

  /** Steps everything; returns true while anything is still moving. */
  function step(now: number): boolean {
    const dt = clamp(((now - prev) / 1000) * tScale, 0, 0.05);
    prev = now;
    if (dt === 0) return true;
    simT += dt;

    if (mode === "free") {
      if (!reduce) {
        yaw += vYaw * dt;
        elev += vElev * dt;
        const d = Math.exp(-FRICTION * dt);
        vYaw *= d;
        vElev *= d;
        // Soft limits on elevation.
        if (elev < ELEV_MIN) vElev += (ELEV_MIN - elev) * 60 * dt;
        if (elev > ELEV_MAX) vElev += (ELEV_MAX - elev) * 60 * dt;
        if (elev < ELEV_MIN || elev > ELEV_MAX) vElev *= Math.exp(-8 * dt);
      }
      const t = (now - releaseT) / 1000;
      // No coasting to a stop somewhere crooked: from release, one
      // continuous spring, seeded with the fling's velocity, carries it
      // into the rest pose it is already heading for.
      if (!held && (reduce ? t > 2.5 : true)) {
        // The detent the throw is heading for, and never one behind the
        // release point while it is still moving.
        let to = nearestRest(yaw + vYaw * 0.3);
        if (vYaw > 0.5 && to < yaw - 1e-6) to += QT;
        if (vYaw < -0.5 && to > yaw + 1e-6) to -= QT;
        settleTo = [to, REST_ELEV];
        mode = "settle";
        if (reduce) {
          yaw = settleTo[0];
          elev = settleTo[1];
        }
      }
    }
    if (mode === "settle") {
      const sy: Spring = { x: yaw, v: vYaw };
      const se: Spring = { x: elev, v: vElev };
      // Barely underdamped: one overshoot you feel more than see.
      springStep(sy, settleTo[0], 4.6, 0.8, dt);
      springStep(se, settleTo[1], 4.6, 0.8, dt);
      yaw = sy.x;
      vYaw = sy.v;
      elev = se.x;
      vElev = se.v;
      // Snap once the remaining error is a hundredth of a degree: far
      // below a pixel, so the snap itself is invisible.
      if (springRest(sy, settleTo[0], 2e-4) && springRest(se, settleTo[1], 2e-4)) {
        qRest = quarterOf(settleTo[0]);
        yaw = REST_YAW + qRest * QT;
        elev = REST_ELEV;
        prevYaw = yaw;
        prevElev = elev;
        vYaw = vElev = 0;
        mode = "idle";
      }
    }

    // Angular velocity actually happening, lightly filtered.
    const iy = (yaw - prevYaw) / dt;
    const ie = (elev - prevElev) / dt;
    prevYaw = yaw;
    prevElev = elev;
    const f = 1 - Math.exp(-dt * 18);
    wYaw += (iy - wYaw) * f;
    wElev += (ie - wElev) * f;
    if (Math.abs(wYaw) < 1e-6) wYaw = 0;
    if (Math.abs(wElev) < 1e-6) wElev = 0;

    const engTo =
      !reduce && (mode === "drag" || mode === "free" || (mode === "settle" && (Math.abs(yaw - settleTo[0]) > 0.3 || Math.abs(vYaw) > 1.2))) ? 1 : 0;
    eng.x += (engTo - eng.x) * (1 - Math.exp(-dt * (engTo ? 10 : 5)));
    if (Math.abs(eng.x - engTo) < 1e-4) eng.x = engTo;
    const speed = Math.hypot(wYaw, wElev);
    let moving = mode !== "idle" || eng.x !== 0;
    let openTarget = hoverOpen || focusOpen || pinnedOpen || now < introUntil ? 1 : 0;
    // A drag turns the mark nearly closed: the sheets only let in air.
    // The stack opens fully when the hand rests.
    if (mode === "drag" && !pinnedOpen) openTarget = Math.min(openTarget, 0.3);
    // The reveal starts once the stack is (nearly) open and at hand.
    const wantReveal = openTarget === 1 && plates[3].open.x > 0.7;
    if (wantReveal && !revealOn) {
      revealOn = true;
      revealT0 = simT;
    }
    springStep(revealFade, wantReveal || (revealOn && openTarget === 1) ? 1 : 0, 16, 1, dt);
    if (springRest(revealFade, Math.round(revealFade.x))) (revealFade.x = Math.round(revealFade.x)), (revealFade.v = 0);
    else moving = true;
    if (revealOn && revealFade.x === 0 && openTarget !== 1) revealOn = false;
    if (revealOn && simT - revealT0 < 2.4) moving = true;

    // The stack lets in a little air while it moves.
    const airTo = reduce ? 0 : 0.07 * Math.tanh(speed / 5);
    springStep(air, airTo, 7, 0.75, dt);
    if (springRest(air, airTo)) air.x = airTo, air.v = 0;
    else moving = true;

    // Hover look-at: the stack leans a little toward the cursor.
    const lookY = reduce || !cursor || mode === "drag" ? 0 : cursor[0] * 0.05;
    const lookE = reduce || !cursor || mode === "drag" ? 0 : cursor[1] * 0.03;
    for (const [s, to] of [
      [look.y, lookY],
      [look.e, lookE],
    ] as [Spring, number][]) {
      springStep(s, to, 5.5, 0.9, dt);
      if (springRest(s, to)) (s.x = to), (s.v = 0);
      else moving = true;
    }

    for (const p of plates) {
      const i = p.i;
      // Fan out, staggered from the top down; each layer its own spring.
      const wOpen = 7.5 + (3 - i) * 1.1;
      if (reduce) (p.open.x = openTarget), (p.open.v = 0);
      else springStep(p.open, openTarget, wOpen, openTarget > p.open.x ? 0.78 : 1, dt);
      if (springRest(p.open, openTarget)) (p.open.x = openTarget), (p.open.v = 0);
      else moving = true;

      // Each sheet trails the turn a little, more the further it sits
      // from the middle of the stack.
      const lever = (i - 1.5) / 1.5; // -1 .. 1
      const lyTo = reduce ? 0 : -0.05 * Math.tanh((wYaw * 0.022 * (1 + 0.6 * Math.abs(lever))) / 0.05) * (0.5 + 0.5 * (i / 3));
      const leTo = reduce ? 0 : -0.035 * Math.tanh((wElev * 0.02 * lever) / 0.035);
      springStep(p.lagY, lyTo, 11, 0.62, dt);
      springStep(p.lagE, leTo, 11, 0.62, dt);
      if (springRest(p.lagY, lyTo, 1e-6)) (p.lagY.x = lyTo), (p.lagY.v = 0);
      else moving = true;
      if (springRest(p.lagE, leTo, 1e-6)) (p.lagE.x = leTo), (p.lagE.v = 0);
      else moving = true;

      // The hovered layer lifts.
      const hTo = hoveredKey === p.def.key && openTarget === 1 ? 0.04 : 0;
      springStep(p.hov, hTo, 14, 0.85, dt);
      if (springRest(p.hov, hTo, 1e-6)) (p.hov.x = hTo), (p.hov.v = 0);
      else moving = true;

      // Parallax: layers shift against each other under the cursor.
      const k = (i - 1.5) * 0.007;
      const pxTo = reduce || !cursor || mode === "drag" ? 0 : cursor[0] * k;
      const pyTo = reduce || !cursor || mode === "drag" ? 0 : -cursor[1] * k * 0.5;
      springStep(p.px, pxTo, 6, 0.9, dt);
      springStep(p.py, pyTo, 6, 0.9, dt);
      if (springRest(p.px, pxTo, 1e-6)) (p.px.x = pxTo), (p.px.v = 0);
      else moving = true;
      if (springRest(p.py, pyTo, 1e-6)) (p.py.x = pyTo), (p.py.v = 0);
      else moving = true;
    }
    if (wYaw !== 0 || wElev !== 0) moving = true;
    if (introUntil && now < introUntil) moving = true;
    return moving;
  }

  function loop(now: number) {
    raf = 0;
    if (dead) return;
    const moving = step(now);
    render();
    // Stop at rest: no idle motion, nothing to draw.
    if (active && moving) raf = requestAnimationFrame(loop);
  }
  function wake() {
    if (dead || !active || raf) return;
    prev = performance.now();
    raf = requestAnimationFrame(loop);
  }

  const ro = new ResizeObserver(() => {
    layout();
    render();
  });
  ro.observe(host);
  layout();
  render();
  opts.onReady();

  return {
    setActive(on) {
      active = on;
      if (on) wake();
      else if (raf) {
        cancelAnimationFrame(raf);
        raf = 0;
      }
    },
    nudge(dy, de) {
      if (mode === "idle" || mode === "settle") mode = "free";
      releaseT = performance.now();
      if (reduce) {
        yaw += dy;
        elev = clamp(elev + de, ELEV_MIN, ELEV_MAX);
      } else {
        vYaw += dy * 4;
        vElev += de * 4;
      }
      wake();
    },
    toggleOpen() {
      pinnedOpen = !pinnedOpen;
      wake();
    },
    intro(ms) {
      if (reduce) return;
      introUntil = performance.now() + ms;
      wake();
    },
    setFocusOpen(v) {
      focusOpen = v;
      wake();
    },
    pose(y, e, o) {
      yaw = y;
      qRest = quarterOf(y);
      elev = e;
      vYaw = vElev = 0;
      mode = "idle";
      prevYaw = y;
      prevElev = e;
      wYaw = wElev = 0;
      for (const p of plates) {
        p.open.x = o;
        p.open.v = 0;
        for (const s of [p.lagY, p.lagE, p.hov, p.px, p.py]) s.x = s.v = 0;
      }
      air.x = air.v = 0;
      eng.x = eng.v = 0;
      look.y.x = look.y.v = look.e.x = look.e.v = 0;
      render();
    },
    state() {
      return { yaw, elev, open: plates[3].open.x, running: raf !== 0, away: awayNow, reveal: revealOn ? simT - revealT0 : -1, vRelease, settleTo: settleTo[0] };
    },
    timeScale(k) {
      tScale = k;
    },
    hold(on) {
      held = on;
      if (!on) {
        releaseT = performance.now() - SETTLE_AFTER * 1000;
        wake();
      }
    },
    dispose() {
      dead = true;
      clearTimeout(hoverTimer);
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onCancel);
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointerleave", onLeave);
      host.removeEventListener("lostpointercapture", onCancel);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}

export { BLEED };
