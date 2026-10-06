import * as THREE from "three";
import { MARK_CY, REST_ELEV, REST_YAW, SVG_UNIT, type Framing } from "./frame";

/* ══════════════════════════════════════════════════════════
   Designer C: "every finding traces back".

   At rest this is the Exira mark, path for path (the plates are the
   mark's own paths un-projected onto their planes, faced with the mark's
   own gradients, strokes and dots; lighting is relative to the rest pose
   so it is exactly zero there). Nothing else is drawn at rest: every
   extra lives in a mask the plate shader multiplies by zero, or in a
   thread mesh that is not visible.

   Engaged, the plates part like an engineering exploded view, and one
   gesture plays out: from three findings etched into the blue plate, a
   hairline drops straight down, through a cross-check lane on the upper
   grey plate, through a module lane on the lower one, onto one dot of
   the evidence plate. Released, the threads retract, the plates close,
   and the pose springs (critically damped) back to the exact rest values,
   snaps, renders that frame and stops.
   ══════════════════════════════════════════════════════════ */

const SIN_E = Math.sin(REST_ELEV);
const COS_E = Math.cos(REST_ELEV);

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
  join: CanvasLineJoin;
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
    join: "miter",
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
    join: "miter",
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
    join: "miter",
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
    join: "round",
  },
];

/** The mark's layer pitch (74 SVG units on screen) as a world height. */
const PITCH = (74 * SVG_UNIT) / COS_E;
const SVG_W = 462;
const HALF_H = 100;
const PAD = 3;

/* Hard elevation limits: below ~16° paper-thin plates turn to slivers;
   above 42° the blue plate hides everything under it. No rubber band. */
const ELEV_MIN = (16 * Math.PI) / 180;
const ELEV_MAX = (38 * Math.PI) / 180;

/* ── the trace ──────────────────────────────────────────
   Lower grey: 6 module lanes, divided along x. Upper grey: 5 cross-check
   lanes, divided along z. Together, the eleven. One thread, dropped from
   a finding on the blue plate, crosses one lane of each and lands on one
   of the evidence plate's own dots: the mark's dot in column 19, row 23
   of its 17 × 15 pattern (SVG 331.5, 352.5), front right of centre. */
const LOWER_N = 6;
const UPPER_N = 5;
const EVIDENCE_DOT: [number, number] = [8.5 + 17 * 19, 7.5 + 15 * 23];
const THREADS: { x: number; z: number }[] = [(() => {
  const [x, z] = unproject(EVIDENCE_DOT[0], EVIDENCE_DOT[1], 322);
  return { x, z };
})()];
const laneOf = (v: number, n: number) => Math.min(n - 1, Math.max(0, Math.floor((v + 0.5) * n)));

/* Timeline of the trace, in ms after the plates are most of the way
   apart. */
const T_START = (k: number) => 260 + k * 400;
const T_MARK = 220; // the finding's dot prints in
const T_DRAW = 900; // thread descends through all three gaps
const T_NODE = 200; // a crossing dot prints in as the thread arrives
const T_SETTLE = 600; // the drawn line relaxes to its resting weight
const TR_TOTAL = T_START(THREADS.length - 1) + 120 + T_DRAW + T_SETTLE;
/** Closing: the trace fades out (never retracts into floating pieces). */
const T_FADE = 180;

export interface MountOptions {
  reduce: boolean;
  coarse: boolean;
  framing: Framing;
  onPart: (part: PartId | null) => void;
  onOpen: (open: boolean) => void;
  onReady: () => void;
}

export interface HeroHandle {
  setActive(active: boolean): void;
  nudge(dyaw: number, delev: number): void;
  toggleOpen(): void;
  intro(ms: number): void;
  /** Test hooks. */
  pose(yaw: number, elev: number, open: number): void;
  state(): { yaw: number; elev: number; open: number; trace: number; settled: boolean; running: boolean };
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

/** Plate (x, z) → SVG point. */
function project(x: number, z: number, cy: number): [number, number] {
  const X = (x + z) / Math.SQRT2;
  const Y = -((z - x) / Math.SQRT2) * SIN_E;
  return [231 + X / SVG_UNIT, cy - Y / SVG_UNIT];
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

/* ── textures ─────────────────────────────────────────── */

function layerCanvas(L: LayerDef, scale: number) {
  const w = Math.ceil((SVG_W + 2 * PAD) * scale);
  const h = Math.ceil((2 * HALF_H + 2 * PAD) * scale);
  const cv = document.createElement("canvas");
  cv.width = w;
  cv.height = h;
  const g = cv.getContext("2d", { willReadFrequently: true })!;
  g.setTransform(scale, 0, 0, scale, PAD * scale, (PAD - (L.cy - HALF_H)) * scale);
  return { cv, g, w, h };
}

/** Plate (x, z) coordinates as the canvas's user space. */
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
  g.lineJoin = L.join;
  g.stroke(p);
  g.globalAlpha = 1;
}

/** The layer exactly as the SVG paints it. */
function faceTexture(L: LayerDef, scale: number) {
  const { cv, g } = layerCanvas(L, scale);
  const p = new Path2D(L.d);
  paintFace(g, L, p);
  if (L.key === "base") {
    // <pattern 17 × 15>, circle (8.5, 7.5) r 1.2, #4E8EFF at 50%.
    g.save();
    g.clip(p);
    g.fillStyle = "rgba(78,142,255,0.5)";
    for (let y = 7.5; y < L.cy + HALF_H + 15; y += 15) {
      if (y < L.cy - HALF_H - 15) continue;
      for (let x = 8.5; x < SVG_W + 17; x += 17) {
        g.beginPath();
        g.arc(x, y, 1.2, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.restore();
  }
  return canvasTexture(cv);
}

/** The evidence plate once turned: the same face with the dots as true
    circles on a square grid in the plate's plane (the mark's dots are
    circles in the picture, so they would smear once turned). */
function plateDotTexture(L: LayerDef, scale: number) {
  const { cv, g } = layerCanvas(L, scale);
  const p = new Path2D(L.d);
  paintFace(g, L, p);
  g.save();
  g.clip(p);
  toPlate(g, L);
  g.fillStyle = "rgba(78,142,255,0.5)";
  // Shifted so one grid dot sits exactly under the trace's evidence dot.
  const n = 14;
  const { x: tx, z: tz } = THREADS[0];
  const ox = tx - (-0.5 + (Math.round((tx + 0.5) * n - 0.5) + 0.5) / n);
  const oz = tz - (-0.5 + (Math.round((tz + 0.5) * n - 0.5) + 0.5) / n);
  for (let i = -1; i <= n; i++)
    for (let j = -1; j <= n; j++) {
      g.beginPath();
      g.arc(-0.5 + (i + 0.5) / n + ox, -0.5 + (j + 0.5) / n + oz, 0.0052, 0, Math.PI * 2);
      g.fill();
    }
  g.restore();
  return canvasTexture(cv);
}

function canvasTexture(cv: HTMLCanvasElement) {
  // Raw values: the plate shader works in the picture's own (sRGB)
  // values and writes them out untouched, so its edges composite onto
  // the page exactly as the browser composites the SVG. (Converting
  // premultiplied colour to sRGB brightens every antialiased edge.)
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.NoColorSpace;
  t.premultiplyAlpha = true;
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  return t;
}

/** Four alpha masks packed into one RGBA data texture (linear data, rows
    flipped to match the canvas textures' orientation). */
function packMasks(cvs: (HTMLCanvasElement | null)[], w: number, h: number) {
  const out = new Uint8Array(w * h * 4);
  cvs.forEach((cv, ch) => {
    if (!cv) return;
    const a = cv.getContext("2d")!.getImageData(0, 0, w, h).data;
    for (let y = 0; y < h; y++) {
      const src = y * w * 4;
      const dst = (h - 1 - y) * w * 4;
      for (let x = 0; x < w; x++) out[dst + x * 4 + ch] = a[src + x * 4 + 3];
    }
  });
  const t = new THREE.DataTexture(out, w, h, THREE.RGBAFormat);
  t.generateMipmaps = false;
  t.minFilter = THREE.LinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.needsUpdate = true;
  return t;
}

/** revA: RGB = thread k's mark on this plate, A = lane hairlines.
    revB: RGB = thread k's crossed lane on this plate.
    Marks are drawn as circles in the picture, like the mark's own dots,
    at a fixed size on screen: `css` is CSS px per SVG unit at rest. */
function revealTextures(L: LayerDef, scale: number, css: number) {
  const bands: (HTMLCanvasElement | null)[] = [];
  const p = new Path2D(L.d);
  const px = (v: number) => v / css; // CSS px → SVG units
  let w = 0;
  let h = 0;
  THREADS.forEach(({ x, z }) => {
    // The trace's marks are not printed here: they are small screen-
    // facing discs (see "marks" in mount), round from every angle, like
    // the mark's own dots.
    const m = layerCanvas(L, scale);
    w = m.w;
    h = m.h;
    if (L.key === "lower" || L.key === "upper") {
      const b = layerCanvas(L, scale);
      b.g.clip(p);
      toPlate(b.g, L);
      b.g.fillStyle = "#000";
      if (L.key === "lower") {
        const i = laneOf(x, LOWER_N);
        b.g.fillRect(-0.5 + i / LOWER_N, -0.6, 1 / LOWER_N, 1.2);
      } else {
        const j = laneOf(z, UPPER_N);
        b.g.fillRect(-0.6, -0.5 + j / UPPER_N, 1.2, 1 / UPPER_N);
      }
      bands.push(b.cv);
    } else bands.push(null);
  });
  let hair: HTMLCanvasElement | null = null;
  if (L.key === "lower" || L.key === "upper") {
    const n = L.key === "lower" ? LOWER_N : UPPER_N;
    const c = layerCanvas(L, scale);
    c.g.clip(p);
    c.g.strokeStyle = "#000";
    c.g.lineWidth = px(0.75);
    c.g.lineCap = "round";
    for (let k = 1; k < n; k++) {
      const a = -0.5 + k / n;
      // Printed separators, inset from the plate's edge.
      const [x0, z0, x1, z1] = L.key === "lower" ? [a, -0.38, a, 0.46] : [-0.46, a, 0.46, a];
      const [sx0, sy0] = project(x0, z0, L.cy);
      const [sx1, sy1] = project(x1, z1, L.cy);
      c.g.beginPath();
      c.g.moveTo(sx0, sy0);
      c.g.lineTo(sx1, sy1);
      c.g.stroke();
    }
    hair = c.cv;
  }
  return {
    revA: packMasks([null, null, null, hair], w, h),
    revB: packMasks([bands[0] ?? null, bands[1] ?? null, bands[2] ?? null, null], w, h),
  };
}

/** The plate's footprint, blurred: the contact shadow a plate casts on
    the one below it while open. */
function shadowTexture(scale: number) {
  const L = LAYERS[2];
  const { cv, g } = layerCanvas(L, scale);
  // Draw the shape far off-canvas and keep only its blurred shadow.
  const off = 4000;
  g.shadowColor = "rgba(0,0,0,1)";
  g.shadowBlur = 7 * scale;
  g.shadowOffsetX = off * scale;
  g.translate(-off, 0);
  g.fillStyle = "#000";
  g.fill(new Path2D(L.d));
  const t = new THREE.CanvasTexture(cv);
  t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping;
  return t;
}

function groundTexture() {
  const n = 256;
  const cv = document.createElement("canvas");
  cv.width = cv.height = n;
  const g = cv.getContext("2d")!;
  const rg = g.createRadialGradient(n / 2, n / 2, 0, n / 2, n / 2, n / 2);
  rg.addColorStop(0, "rgba(0,20,72,0.028)");
  rg.addColorStop(0.55, "rgba(0,20,72,0.01)");
  rg.addColorStop(1, "rgba(0,20,72,0)");
  g.fillStyle = rg;
  g.fillRect(0, 0, n, n);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/* ── material ─────────────────────────────────────────── */

const LIGHT = new THREE.Vector3(-0.42, 0.78, 0.46).normalize();
const N_REST = new THREE.Vector3(0, COS_E, SIN_E);
/** The light the contact shadows fall from: higher than the shading
    light, so a plate's shadow sits mostly under it. View space. */
const SHADOW_LIGHT = new THREE.Vector3(-0.22, 0.95, 0.3).normalize();

const vert = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN;
  void main() {
    vUv = uv;
    vN = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }`;

const frag = /* glsl */ `
  uniform sampler2D map;
  uniform sampler2D map2;
  uniform sampler2D revA;
  uniform sampler2D revB;
  uniform sampler2D shadowMap;
  uniform float mix2;
  uniform float hasRev;
  uniform vec3 nodeP;
  uniform vec3 tintP;
  uniform float hairA;
  uniform vec3 markColor;
  uniform vec3 tintColor;
  uniform float tintMax;
  uniform float hairMax;
  uniform vec3 hairColor;
  uniform vec2 shadowOff;
  uniform float shadowAmt;
  uniform vec3 light;
  uniform vec3 nRest;
  uniform float shade;
  uniform float sheen;
  varying vec2 vUv;
  varying vec3 vN;
  float spec(vec3 n) {
    vec3 h = normalize(light + vec3(0.0, 0.0, 1.0));
    return pow(max(dot(n, h), 0.0), 48.0);
  }
  void main() {
    vec4 t = texture2D(map, vUv);
    if (mix2 > 0.0) t = mix(t, texture2D(map2, vUv), mix2);
    vec3 c = t.rgb;
    if (hasRev > 0.5) {
      vec4 a = texture2D(revA, vUv);
      vec4 b = texture2D(revB, vUv);
      c = mix(c, tintColor * t.a, clamp(dot(b.rgb, tintP), 0.0, 1.0) * tintMax);
      c = mix(c, hairColor * t.a, a.a * hairA * hairMax);
      c = mix(c, markColor * t.a, clamp(dot(a.rgb, nodeP), 0.0, 1.0));
    }
    if (shadowAmt > 0.0) {
      // Only a soft crease where the edge of the plate above falls, never
      // a broad blot: the plates are paper, not slabs.
      float s = texture2D(shadowMap, vUv + shadowOff).a;
      c *= 1.0 - shadowAmt * clamp(4.0 * s * (1.0 - s), 0.0, 1.0);
    }
    vec3 n = normalize(vN);
    // Zero at rest by construction: the rest frame is the texture.
    float d = dot(n, light) - dot(nRest, light);
    float s = spec(n) - spec(nRest);
    c = c * (1.0 + shade * d) + vec3(sheen * s) * t.a;
    gl_FragColor = vec4(c, t.a);
  }`;

function plateMaterial(map: THREE.Texture, shade: number, sheen: number, shadow: THREE.Texture) {
  return new THREE.ShaderMaterial({
    uniforms: {
      map: { value: map },
      map2: { value: map },
      revA: { value: shadow },
      revB: { value: shadow },
      shadowMap: { value: shadow },
      mix2: { value: 0 },
      hasRev: { value: 0 },
      nodeP: { value: new THREE.Vector3() },
      tintP: { value: new THREE.Vector3() },
      hairA: { value: 0 },
      markColor: { value: hex("#234D9E") },
      tintColor: { value: hex("#234D9E") },
      tintMax: { value: 0.06 },
      hairMax: { value: 0.24 },
      hairColor: { value: hex("#5D7092") },
      shadowOff: { value: new THREE.Vector2() },
      shadowAmt: { value: 0 },
      light: { value: LIGHT },
      nRest: { value: N_REST },
      shade: { value: shade },
      sheen: { value: sheen },
    },
    vertexShader: vert,
    fragmentShader: frag,
    transparent: true,
    premultipliedAlpha: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
  });
}

/* ── helpers ──────────────────────────────────────────── */
/** A colour as raw sRGB values, for the plate shader. */
function hex(h: string) {
  const n = parseInt(h.slice(1), 16);
  return new THREE.Vector3(((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255);
}
const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const sstep = (a: number, b: number, v: number) => {
  const u = clamp((v - a) / (b - a), 0, 1);
  return u * u * (3 - 2 * u);
};

export function mount(host: HTMLElement, opts: MountOptions): HeroHandle {
  const { reduce, coarse, framing } = opts;
  const SPREAD = framing.spread;

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: "low-power", preserveDrawingBuffer: false });
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

  /* tilt (screen x) ∘ spin (object up) ∘ stack (pivot at the stack's
     centre, so turning never swings the object off its spot). */
  const tilt = new THREE.Group();
  tilt.position.y = MARK_CY;
  const spin = new THREE.Group();
  const stack = new THREE.Group();
  stack.position.y = -1.5 * PITCH;
  tilt.add(spin);
  spin.add(stack);
  scene.add(tilt);

  /* Texture density: twice the device pixels per SVG unit at rest, sampled
     without mipmaps, so the rest frame is as crisp as the SVG itself (a
     mip chain softens every edge by a pixel or two). */
  const sr0 = host.getBoundingClientRect();
  const devPerSvg = ((Math.min(sr0.width || 480, sr0.height || 480) / (2 * framing.hx)) * SVG_UNIT) * Math.min(devicePixelRatio || 1, 2);
  const scale = clamp(Math.ceil(devPerSvg * 2 * 4) / 4, 2, 5);
  const revScale = scale;
  const cssPerSvg = (Math.min(sr0.width || 480, sr0.height || 480) / (2 * framing.hx)) * SVG_UNIT;
  const shadowMap = keep(shadowTexture(1.5));

  interface Plate {
    def: LayerDef;
    group: THREE.Group;
    mat: THREE.ShaderMaterial;
    mesh: THREE.Mesh;
  }
  const plates: Plate[] = LAYERS.map((def, i) => {
    const group = new THREE.Group();
    stack.add(group);
    const geo = keep(plateGeometry(def));
    const mat = keep(plateMaterial(keep(faceTexture(def, scale)), def.key === "top" ? 0.32 : 0.22, def.key === "top" ? 0.1 : 0.06, shadowMap));
    const { revA, revB } = revealTextures(def, revScale, cssPerSvg);
    mat.uniforms.revA.value = keep(revA);
    mat.uniforms.revB.value = keep(revB);
    mat.uniforms.hasRev.value = 1;
    mat.uniforms.markColor.value = hex(def.key === "top" ? "#FFFFFF" : def.key === "base" ? "#4E8EFF" : "#234D9E");
    if (def.key === "lower") mat.uniforms.hairMax.value = 0.18;
    mat.uniforms.tintMax.value = def.key === "upper" ? 0.035 : 0.045;
    if (def.key === "base") mat.uniforms.map2.value = keep(plateDotTexture(def, scale));
    const mesh = new THREE.Mesh(geo, mat);
    mesh.renderOrder = 10 * i;
    group.add(mesh);
    return { def, group, mat, mesh };
  });

  /* threads: three segments each, one per gap, each drawn between the
     two plates it joins so the plate above covers it where it should. */
  const threadMat = THREADS.map(() =>
    keep(new THREE.MeshBasicMaterial({ color: new THREE.Color("#234D9E"), transparent: true, opacity: 0.9, depthTest: false, depthWrite: false }))
  );
  const segGeo = keep(new THREE.CylinderGeometry(1, 1, 1, 10, 1, true));
  segGeo.translate(0, -0.5, 0); // spans y ∈ [-1, 0]: hangs from its top
  const segs: THREE.Mesh[][] = THREADS.map(({ x, z }, k) =>
    [0, 1, 2].map((s) => {
      const m = new THREE.Mesh(segGeo, threadMat[k]);
      m.position.set(x, 0, z);
      m.renderOrder = 10 * (2 - s) + 5;
      m.visible = false;
      stack.add(m);
      return m;
    })
  );

  /* marks: per plate, the trace's dot (and on the evidence plate, the
     one ring), as discs facing the camera at a fixed CSS size. Drawn
     right after their plate, so the plates above cover them. */
  interface Mark {
    mesh: THREE.Mesh;
    mat: THREE.MeshBasicMaterial;
    plate: number;
    k: number;
    /** Radius in CSS px. */
    r: number;
    peak: number;
  }
  const discGeo = keep(new THREE.CircleGeometry(1, 40));
  const ringGeo = keep(new THREE.RingGeometry(1 - 1 / 5.5, 1, 64));
  const marks: Mark[] = [];
  const cssPerSvgRest = cssPerSvg;
  THREADS.forEach((_, k) => {
    const add = (plate: number, geo: THREE.BufferGeometry, color: string, r: number, peak: number) => {
      const mat = keep(new THREE.MeshBasicMaterial({ color: new THREE.Color(color), transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
      const mesh = new THREE.Mesh(geo, mat);
      mesh.renderOrder = 10 * plate + 1;
      mesh.visible = false;
      scene.add(mesh);
      marks.push({ mesh, mat, plate, k, r, peak });
    };
    add(3, discGeo, "#FFFFFF", 2.3, 0.88);
    add(2, discGeo, "#234D9E", 2.1, 0.92);
    add(1, discGeo, "#234D9E", 2.1, 0.92);
    // The evidence dot: the mark's own dot (r 1.2 SVG units), at full colour.
    add(0, discGeo, "#4E8EFF", Math.max(2.5, 1.2 * cssPerSvgRest), 1);
    add(0, ringGeo, "#4E8EFF", 6, 0.6);
  });
  const markPos = new THREE.Vector3();

  const ground = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(1.5, 1.5)),
    keep(new THREE.MeshBasicMaterial({ map: keep(groundTexture()), transparent: true, depthWrite: false, depthTest: false, opacity: 0 }))
  );
  ground.rotation.x = -Math.PI / 2;
  ground.position.y = -0.05;
  ground.renderOrder = -1;
  ground.visible = false;
  plates[0].group.add(ground);

  /* ── state ── */
  let yaw = REST_YAW;
  let elev = REST_ELEV;
  let vYaw = 0;
  let vElev = 0;
  let homeYaw = REST_YAW;
  let phase: "rest" | "drag" | "coast" | "hold" | "spring" = "rest";
  let holdUntil = 0;

  /** Plate spread, per plate (springs), and their velocities. */
  const o = [0, 0, 0, 0];
  const vo = [0, 0, 0, 0];
  let oTarget = 0;
  /** Trace timeline, ms, and its visibility (fades out on close). */
  let tr = 0;
  let vis = 1;
  /** The once-per-session breath on load: the plates part a little and
      close, nothing else. */
  let breathUntil = 0;

  let hoverOpen = false;
  let pinnedOpen = false;
  let dragOpen = false;
  let hoverTimer: ReturnType<typeof setTimeout> | undefined;
  let hoveredKey: PartKey | null = null;
  let px = 0;
  let py = 0;
  let pointerInside = false;
  let lastOpen = false;

  let dragging = false;
  let active = false;
  let raf = 0;
  let dead = false;
  let settled = false;
  let W = 0;

  function layout() {
    const sr = host.getBoundingClientRect();
    // Snap the canvas to whole device pixels: a canvas composited at a
    // fractional offset is resampled, which softens every edge of the
    // rest frame by a pixel against the SVG.
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.style.transform = "";
    const c0 = canvas.getBoundingClientRect();
    const fx = c0.left * dpr - Math.round(c0.left * dpr);
    const fy = c0.top * dpr - Math.round(c0.top * dpr);
    if (fx || fy) canvas.style.transform = `translate(${-fx / dpr}px, ${-fy / dpr}px)`;
    const cr = canvas.getBoundingClientRect();
    if (!sr.width || !sr.height || !cr.width || !cr.height) return;
    W = cr.width;
    // Resizing clears the drawing buffer, so only when something changed.
    const bw = Math.round(cr.width * dpr);
    const bh = Math.round(cr.height * dpr);
    if (canvas.width !== bw || canvas.height !== bh) {
      renderer.setPixelRatio(dpr);
      renderer.setSize(cr.width, cr.height, false);
    }
    const s = Math.min(sr.width, sr.height) / (2 * framing.hx);
    const stageMid = sr.top + sr.height / 2;
    camera.left = -(cr.width / 2) / s;
    camera.right = cr.width / 2 / s;
    camera.top = MARK_CY + (stageMid - cr.top) / s;
    camera.bottom = camera.top - cr.height / s;
    camera.updateProjectionMatrix();
  }

  const lightObj = new THREE.Vector3();
  const AX = new THREE.Vector3(1, 0, 0);
  const AY = new THREE.Vector3(0, 1, 0);

  function dotAway() {
    const dy = Math.abs(yaw - homeYaw);
    const de = Math.abs(elev - REST_ELEV);
    return sstep(0, 1, Math.max((dy - 0.11) / 0.25, (de - 0.06) / 0.15));
  }
  function rotAway() {
    const dy = Math.abs(yaw - homeYaw);
    const de = Math.abs(elev - REST_ELEV);
    return clamp(Math.max(dy / 0.3, de / 0.18), 0, 1);
  }

  function render() {
    tilt.rotation.x = elev;
    spin.rotation.y = yaw;

    // Plate heights: each moves away from the stack's centre.
    const ys = o.map((oi, i) => i * PITCH + (i - 3 * framing.anchor) * PITCH * SPREAD * oi);
    plates.forEach((p, i) => (p.group.position.y = ys[i]));
    const oAvg = (o[0] + o[1] + o[2] + o[3]) / 4;
    const oMax = Math.max(Math.abs(o[0]), Math.abs(o[3]));

    // The light the shadows fall from, in the object's own frame.
    lightObj.copy(SHADOW_LIGHT).applyAxisAngle(AX, -elev).applyAxisAngle(AY, -yaw);
    const lx = lightObj.x / lightObj.y;
    const lz = lightObj.z / lightObj.y;

    const hairA = reduce ? (oAvg > 0.5 ? 1 : 0) : sstep(0.35, 1, oAvg);
    const away = rotAway();

    plates.forEach((p, i) => {
      const u = p.mat.uniforms;
      u.hairA.value = hairA;
      if (i < 3) {
        const gap = ys[i + 1] - ys[i];
        // Shadow of the plate above, displaced toward the light.
        const dx = gap * lx;
        const dz = gap * lz;
        const dsx = (dx + dz) / Math.SQRT2 / SVG_UNIT;
        const dsy = (((dz - dx) / Math.SQRT2) * SIN_E) / SVG_UNIT;
        (u.shadowOff.value as THREE.Vector2).set(dsx / (SVG_W + 2 * PAD), -dsy / (2 * HALF_H + 2 * PAD));
        u.shadowAmt.value = 0;
      }
      const nodes = u.nodeP.value as THREE.Vector3;
      const tint = u.tintP.value as THREE.Vector3;
      THREADS.forEach((_, k) => {
        const s0 = T_START(k);
        const d0 = s0 + 120;
        let at: number;
        if (p.def.key === "top") at = s0;
        else if (p.def.key === "upper") at = d0 + T_DRAW / 3;
        else if (p.def.key === "lower") at = d0 + (2 * T_DRAW) / 3;
        else at = d0 + T_DRAW;
        const a = clamp((tr - at) / (p.def.key === "top" ? T_MARK : T_NODE), 0, 1);
        nodes.setComponent(k, a * vis * (p.def.key === "top" ? 0.85 : p.def.key === "base" ? 1 : 0.9));
        tint.setComponent(k, a * vis);
      });
    });
    // The evidence dots stay the mark's own until the plate is really
    // turned (hover parallax alone never swaps them).
    plates[0].mat.uniforms.mix2.value = dotAway();

    // Threads.
    THREADS.forEach((_, k) => {
      const d0 = T_START(k) + 120;
      const dp = clamp((tr - d0) / T_DRAW, 0, 1);
      const relax = clamp((tr - d0 - T_DRAW) / T_SETTLE, 0, 1);
      threadMat[k].opacity = (0.92 - 0.3 * sstep(0, 1, relax)) * vis;
      segs[k].forEach((m, s) => {
        const sp = clamp(dp * 3 - s, 0, 1);
        const upper = 3 - s;
        const len = sp * (ys[upper] - ys[upper - 1]);
        m.visible = len > 1e-5 && vis > 0;
        m.position.y = ys[upper];
        // Radius in world units: about 1.3 CSS px whatever the stage size.
        const r = 0.65 / Math.max(1, pxPerUnit);
        m.scale.set(r, len, r);
      });
    });

    stack.updateMatrixWorld();
    for (const mk of marks) {
      const { x, z } = THREADS[mk.k];
      const key = LAYERS[mk.plate].key;
      const s0 = T_START(mk.k);
      const d0 = s0 + 120;
      const at = key === "top" ? s0 : key === "upper" ? d0 + T_DRAW / 3 : key === "lower" ? d0 + (2 * T_DRAW) / 3 : d0 + T_DRAW;
      const a = clamp((tr - at) / (key === "top" ? T_MARK : T_NODE), 0, 1) * vis;
      mk.mesh.visible = a > 0;
      if (!mk.mesh.visible) continue;
      mk.mat.opacity = a * mk.peak;
      markPos.set(x, ys[mk.plate], z);
      stack.localToWorld(markPos);
      mk.mesh.position.copy(markPos);
      mk.mesh.position.z += 1; // in front of its plate's plane; order is by renderOrder
      const r = mk.r / Math.max(1, pxPerUnit);
      mk.mesh.scale.set(r, r, 1);
    }

    // Ground: only while open or turned; never at rest.
    const g = Math.max(sstep(0, 1, oMax), away);
    ground.visible = g > 0.001;
    (ground.material as THREE.MeshBasicMaterial).opacity = g;

    renderer.render(scene, camera);
    // Development: the capture harness records frames straight from the
    // drawing buffer (screenshots are too slow to see the motion).
    const rec = (window as unknown as { __heroCRec?: { t: number; url: string }[] }).__heroCRec;
    if (process.env.NODE_ENV !== "production" && rec && rec.length < 400) rec.push({ t: performance.now(), url: canvas.toDataURL("image/webp", 0.9) });
  }

  let pxPerUnit = 300;
  function measure() {
    const sr = host.getBoundingClientRect();
    if (sr.width) pxPerUnit = Math.min(sr.width, sr.height) / (2 * framing.hx);
  }

  /* ── picking ── */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const meshes = plates.map((p) => p.mesh);
  function pickAt(cx: number, cy: number): PartId | null {
    const r = canvas.getBoundingClientRect();
    ndc.set(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    // Plates are drawn painter-style without depth; the nearest hit along
    // the view ray is the visible one.
    const hit = ray.intersectObjects(meshes, false)[0];
    if (!hit) return null;
    const p = plates.find((q) => q.mesh === hit.object);
    return p ? { kind: p.def.key } : null;
  }
  function setHover(part: PartId | null) {
    const k = part ? part.kind : null;
    if (k === hoveredKey) return;
    hoveredKey = k;
    opts.onPart(part);
  }

  /* ── input (on the stage, not the canvas: the canvas overflows the
     stage for the open stack, and must never sit over the page) ── */
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
    if (e.pointerType === "mouse" || e.pointerType === "pen") beginDrag();
    else touchMode = "pending";
    wake();
  }
  function beginDrag() {
    dragging = true;
    dragOpen = true;
    phase = "drag";
    vYaw = vElev = 0;
    try {
      host.setPointerCapture(pid);
    } catch {}
    host.classList.add("is-grabbing");
  }
  function onMove(e: PointerEvent) {
    const r = host.getBoundingClientRect();
    if (e.pointerType === "mouse") {
      px = clamp(((e.clientX - r.left) / r.width) * 2 - 1, -1, 1);
      py = clamp(((e.clientY - r.top) / r.height) * 2 - 1, -1, 1);
      if (!dragging) {
        setHover(openNow() ? pickAt(e.clientX, e.clientY) : null);
        wake();
        return;
      }
    }
    if (e.pointerId !== pid) return;
    if (touchMode === "pending") {
      const dx = Math.abs(e.clientX - downX);
      const dy = Math.abs(e.clientY - downY);
      if (dx > 6 && dx > dy * 1.2) {
        touchMode = "rotate";
        beginDrag();
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
    if (touchMode !== "rotate") elev = clamp(elev + dy * k, ELEV_MIN, ELEV_MAX);
    wake();
  }
  function onUp(e: PointerEvent) {
    if (e.pointerId !== pid) return;
    const now = performance.now();
    const moved = Math.hypot(e.clientX - downX, e.clientY - downY);
    if (dragging) {
      vYaw = vElev = 0;
      if (!reduce && samples.length > 1) {
        const a = samples[0];
        const b = samples[samples.length - 1];
        const dt = Math.max(16, b.t - a.t);
        if (now - b.t < 60) {
          const k = perPx();
          vYaw = clamp(((b.x - a.x) / dt) * 1000 * k, -14, 14);
          vElev = touchMode === "rotate" ? 0 : clamp(((b.y - a.y) / dt) * 1000 * k, -4, 4);
        }
      }
      phase = "coast";
    }
    if (e.pointerType !== "mouse" && moved < 6 && now - downT < 500) {
      // A tap opens or closes; on an open stack it also names the layer.
      if (!openNow()) pinnedOpen = true;
      else {
        const part = pickAt(e.clientX, e.clientY);
        if (part && hoveredKey !== part.kind) setHover(part);
        else {
          pinnedOpen = false;
          setHover(null);
        }
      }
    }
    endDrag(e.pointerId);
    wake();
  }
  function endDrag(id: number) {
    dragging = false;
    touchMode = "none";
    pid = -1;
    host.classList.remove("is-grabbing");
    try {
      host.releasePointerCapture(id);
    } catch {}
  }
  function onCancel(e: PointerEvent) {
    if (e.pointerId !== pid) return;
    if (dragging) phase = "coast";
    endDrag(e.pointerId);
    wake();
  }
  function onEnter(e: PointerEvent) {
    if (e.pointerType !== "mouse") return;
    pointerInside = true;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(() => {
      hoverOpen = true;
      wake();
    }, 140);
  }
  function onLeave(e: PointerEvent) {
    if (e.pointerType !== "mouse") return;
    clearTimeout(hoverTimer);
    pointerInside = false;
    hoverOpen = false;
    px = py = 0;
    if (!dragging) setHover(null);
    wake();
  }
  host.addEventListener("pointerdown", onDown);
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerup", onUp);
  host.addEventListener("pointercancel", onCancel);
  host.addEventListener("pointerenter", onEnter);
  host.addEventListener("pointerleave", onLeave);

  function openNow() {
    return hoverOpen || pinnedOpen || dragOpen;
  }

  /* ── loop ── */
  let prev = performance.now();

  function step(now: number) {
    const dt = clamp((now - prev) / 1000, 0, 0.05);
    // The trace runs on the wall clock (a slow device must not stretch it
    // into seconds); the physics keeps the clamped step for stability.
    const wall = clamp(now - prev, 0, 250);
    prev = now;

    // Released drags stay open while the object is still moving or held.
    if (dragOpen && !dragging && (phase === "rest" || phase === "spring") && !pointerInside) dragOpen = false;
    if (dragOpen && !dragging && pointerInside && phase === "rest") dragOpen = false;

    const want = openNow();
    if (want !== lastOpen) {
      lastOpen = want;
      opts.onOpen(want);
      if (!want) setHover(null);
    }

    /* Trace timeline and plate spread. Opening: plates first, then the
       trace once they are most of the way apart. Closing: the trace
       fades (a retracting line would leave pieces floating between the
       plates), then the plates close. */
    if (reduce) {
      oTarget = want ? 1 : 0;
      for (let i = 0; i < 4; i++) (o[i] = oTarget), (vo[i] = 0);
      tr = want ? TR_TOTAL : 0;
      vis = 1;
    } else {
      if (want) {
        oTarget = 1;
        if (tr > 0 && vis < 1) {
          // Re-opened mid-fade: the trace is already drawn, bring it back.
          vis = Math.min(1, vis + wall / T_FADE);
        } else if (Math.min(o[0], o[3]) > 0.55) tr = Math.min(TR_TOTAL, tr + wall);
      } else {
        if (tr > 0) {
          vis = Math.max(0, vis - wall / T_FADE);
          if (vis === 0) tr = 0;
        }
        if (tr === 0) {
          vis = 1;
          oTarget = now < breathUntil ? 0.15 / SPREAD : 0;
        }
      }
      for (let i = 0; i < 4; i++) {
        // Outer plates lead by a hair; opening is barely underdamped (a
        // whisper of overshoot), closing is critically damped so the
        // plates land on the mark without passing through it.
        const lag = i === 1 || i === 2 ? 0.88 : 1;
        const w = (oTarget ? 10.5 : 12) * lag;
        const z = oTarget ? 0.8 : 1;
        const a = w * w * (oTarget - o[i]) - 2 * z * w * vo[i];
        vo[i] += a * dt;
        o[i] += vo[i] * dt;
        if (Math.abs(o[i] - oTarget) < 1e-4 && Math.abs(vo[i]) < 1e-3) {
          o[i] = oTarget;
          vo[i] = 0;
        }
      }
      // Never let a closing plate pass its rest position.
      if (!oTarget) for (let i = 0; i < 4; i++) if (o[i] < 0) (o[i] = 0), (vo[i] = 0);
    }

    /* Pose. */
    if (!dragging) {
      if (phase === "coast") {
        if (reduce) phase = "hold";
        else {
          yaw += vYaw * dt;
          elev += vElev * dt;
          const f = Math.exp(-3.2 * dt);
          vYaw *= f;
          vElev *= f;
          if (elev < ELEV_MIN || elev > ELEV_MAX) {
            elev = clamp(elev, ELEV_MIN, ELEV_MAX);
            vElev = 0;
          }
          if (!pointerInside && Math.abs(vYaw) < 3 && Math.abs(vElev) < 3) {
            // Nobody is looking closely: hand the motion straight to the
            // spring, velocity and all, aimed at the rest turn nearest to
            // where the fling would have stopped. It never stops at a
            // false 90° or 180° rhombus first.
            homeYaw = REST_YAW + 2 * Math.PI * Math.round((yaw + vYaw / 3.2 - REST_YAW) / (2 * Math.PI));
            phase = "spring";
          } else if (Math.abs(vYaw) < 0.25 && Math.abs(vElev) < 0.25) {
            phase = "hold";
            holdUntil = now + (pointerInside ? 1400 : 250);
          }
        }
      }
      if (phase === "hold") {
        if (!reduce) {
          // Bleed off what velocity is left.
          yaw += vYaw * dt;
          elev = clamp(elev + vElev * dt, ELEV_MIN, ELEV_MAX);
          const f = Math.exp(-6 * dt);
          vYaw *= f;
          vElev *= f;
        }
        if (now >= holdUntil || (!pointerInside && now >= holdUntil - 1000)) {
          phase = "spring";
          homeYaw = REST_YAW + 2 * Math.PI * Math.round((yaw - REST_YAW) / (2 * Math.PI));
        }
      }
      if (phase === "spring" || phase === "rest") {
        // Pointer parallax while hovering; exactly the rest pose otherwise.
        const ty = homeYaw + (pointerInside && !coarse ? px * 0.09 : 0);
        const te = REST_ELEV + (pointerInside && !coarse ? -py * 0.045 : 0);
        if (reduce) {
          yaw = ty;
          elev = te;
          vYaw = vElev = 0;
        } else {
          const w = 6.5;
          vYaw += (w * w * (ty - yaw) - 2 * w * vYaw) * dt;
          vElev += (w * w * (te - elev) - 2 * w * vElev) * dt;
          yaw += vYaw * dt;
          elev += vElev * dt;
          if (Math.abs(yaw - ty) < 1e-5 && Math.abs(vYaw) < 1e-4 && Math.abs(elev - te) < 1e-5 && Math.abs(vElev) < 1e-4) {
            yaw = ty;
            elev = te;
            vYaw = vElev = 0;
            phase = "rest";
          } else phase = "spring";
        }
        if (phase === "rest" && !pointerInside) {
          // Exactly home: also bring the yaw back into one turn.
          yaw = REST_YAW;
          homeYaw = REST_YAW;
          elev = REST_ELEV;
        }
      }
    }

    render();

    settled =
      !dragging &&
      phase === "rest" &&
      o.every((v, i) => v === oTarget && vo[i] === 0) &&
      (tr === 0 || (tr === TR_TOTAL && vis === 1)) &&
      now >= breathUntil;
  }

  function loop(now: number) {
    if (dead) return;
    step(now);
    if (active && !settled) raf = requestAnimationFrame(loop);
    else raf = 0;
  }

  function wake() {
    settled = false;
    if (dead || !active || raf) return;
    layout();
    prev = performance.now();
    raf = requestAnimationFrame(loop);
  }

  const ro = new ResizeObserver(() => {
    layout();
    measure();
    if (!raf) render();
  });
  ro.observe(host);
  // Entrance animations move the stage by transforms, which a
  // ResizeObserver never sees: re-snap and redraw when they finish.
  const resnap = () => {
    if (dead || !active) return;
    layout();
    if (!raf) render();
  };
  document.addEventListener("transitionend", resnap);
  document.addEventListener("animationend", resnap);
  layout();
  measure();
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
      if (reduce) {
        yaw += dy;
        elev = clamp(elev + de, ELEV_MIN, ELEV_MAX);
        phase = "hold";
        holdUntil = performance.now() + 2500;
      } else {
        vYaw += dy * 4;
        vElev += de * 4;
        phase = "coast";
      }
      wake();
    },
    toggleOpen() {
      pinnedOpen = !pinnedOpen;
      wake();
    },
    intro(ms) {
      if (reduce) return;
      breathUntil = performance.now() + ms;
      wake();
      setTimeout(wake, ms + 20);
    },
    pose(y, e, op) {
      yaw = y;
      elev = e;
      vYaw = vElev = 0;
      homeYaw = REST_YAW + 2 * Math.PI * Math.round((y - REST_YAW) / (2 * Math.PI));
      for (let i = 0; i < 4; i++) (o[i] = op), (vo[i] = 0);
      tr = op >= 1 ? TR_TOTAL : 0;
      render();
    },
    state() {
      return { yaw, elev, open: (o[0] + o[1] + o[2] + o[3]) / 4, trace: tr / TR_TOTAL, settled, running: raf !== 0 };
    },
    dispose() {
      dead = true;
      clearTimeout(hoverTimer);
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      document.removeEventListener("transitionend", resnap);
      document.removeEventListener("animationend", resnap);
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onCancel);
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointerleave", onLeave);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
      canvas.remove();
    },
  };
}
