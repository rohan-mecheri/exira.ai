import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

/* ══════════════════════════════════════════════════════════
   Designer D: "The Assay". Round 1 massing pass.

   A sealed instrument case of eleven segments around a hidden core:
   a turned plinth, an eleven-segment wall, a stepped cap. Two features
   project from the wall and break the outline all the way round: the
   findings port (the only opening) and, opposite it, the intake hatch.

   Units: the wall's apothem is 1. y is up; the plinth sits on y = 0.
   ══════════════════════════════════════════════════════════ */

const N = 11;
const STEP = (2 * Math.PI) / N;
/** Wall: outer apothem, inner radius, split gap. */
const A_OUT = 1;
const R_IN = 0.64;
const GAP = 0.008;
/** Heights. */
const PLINTH_H = 0.09;
/** A dark collar band under and over the segment wall: stacked construction. */
const BAND = 0.1;
const WALL_Y0 = PLINTH_H + BAND + 0.012;
const WALL_H = 0.6;
const TOP_BAND_Y0 = WALL_Y0 + WALL_H + 0.012;
const CAP_Y0 = TOP_BAND_Y0 + 0.08 + 0.01;
/** The wall leans in: the upper edge's apothem as a fraction of the lower. */
const TAPER = 0.9;
const TERR = [
  { a: 0.86, h: 0.08 },
  { a: 0.72, h: 0.08 },
  { a: 0.56, h: 0.07 },
];
/** The port faces +x at yaw 0, on a vertex; the hatch is opposite. */
const PORT_ANGLE = 0;

export type PartId = { kind: "case" | "segment" | "core" | "finding" | "port" | "hatch"; index?: number };

export interface MountOptions {
  reduce: boolean;
  coarse: boolean;
  onPart: (part: PartId | null) => void;
  onReady: () => void;
}

export interface HeroHandle {
  setActive(active: boolean): void;
  nudge(dyaw: number): void;
  toggleOpen(): void;
  setFocusOpen(open: boolean): void;
  /** Test hooks. */
  pose(yaw: number, open: number): void;
  state(): { yaw: number; vYaw: number; open: number; running: boolean };
  dispose(): void;
}

/* ── geometry helpers ─────────────────────────────────── */

const polar = (r: number, t: number) => new THREE.Vector2(r * Math.cos(t), r * Math.sin(t));
const vR = (apothem: number) => apothem / Math.cos(STEP / 2);

/** A regular N-gon (vertex at angle `phase`), as a Shape in the xz plane. */
function ngon(apothem: number, phase = PORT_ANGLE): THREE.Vector2[] {
  const r = vR(apothem);
  const pts: THREE.Vector2[] = [];
  for (let k = 0; k < N; k++) pts.push(polar(r, phase + k * STEP));
  return pts;
}

/** Extrude a shape drawn in the xz plane (2D x → world x, 2D y → world z)
    upward by h from y0, with a small chamfer. */
function prism(outline: THREE.Vector2[], y0: number, h: number, chamfer: number, holes: THREE.Vector2[][] = []) {
  // ExtrudeGeometry extrudes along +z; we rotate z → y. Rotating by -90°
  // about x maps (x, y, z) → (x, z, -y), so flip the outline's y first.
  const s = new THREE.Shape(outline.map((p) => new THREE.Vector2(p.x, -p.y)));
  for (const h0 of holes) s.holes.push(new THREE.Path(h0.map((p) => new THREE.Vector2(p.x, -p.y))));
  const g = new THREE.ExtrudeGeometry(s, {
    depth: Math.max(1e-4, h - 2 * chamfer),
    bevelEnabled: chamfer > 0,
    bevelThickness: chamfer,
    bevelSize: chamfer,
    bevelOffset: -chamfer,
    bevelSegments: 1,
    curveSegments: 48,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0 + chamfer, 0);
  g.computeVertexNormals();
  return g;
}

/** Lean a vertical prism inward: scale x, z by lerp(s0, s1) over its height. */
function taper(g: THREE.BufferGeometry, y0: number, h: number, s0: number, s1: number) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const t = Math.min(1, Math.max(0, (p.getY(i) - y0) / h));
    const k = s0 + (s1 - s0) * t;
    p.setX(i, p.getX(i) * k);
    p.setZ(i, p.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
}

function circle(r: number, n = 64) {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i < n; i++) pts.push(polar(r, (i / n) * Math.PI * 2));
  return pts;
}

/** One wall segment: the part of the wall between two vertices. */
function segmentOutline(k: number) {
  const t0 = PORT_ANGLE + k * STEP;
  const t1 = t0 + STEP;
  const ro = vR(A_OUT);
  const ri = R_IN / Math.cos(STEP / 2);
  const off = (t: number, sgn: number) => new THREE.Vector2(-Math.sin(t), Math.cos(t)).multiplyScalar((sgn * GAP) / 2);
  const a = polar(ri, t0).add(off(t0, 1));
  const b = polar(ro, t0).add(off(t0, 1));
  const c = polar(ro, t1).add(off(t1, -1));
  const d = polar(ri, t1).add(off(t1, -1));
  return [a, b, c, d];
}

/** A lathe profile for the turned plinth: chamfered disc with a step. */
function plinthGeometry() {
  const R = vR(A_OUT) + 0.07;
  const pts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(R - 0.02, 0),
    new THREE.Vector2(R, 0.02),
    new THREE.Vector2(R, PLINTH_H - 0.03),
    new THREE.Vector2(R - 0.03, PLINTH_H),
    new THREE.Vector2(0, PLINTH_H),
  ];
  const g = new THREE.LatheGeometry(pts, 128);
  g.computeVertexNormals();
  return g;
}

export function mount(host: HTMLElement, opts: MountOptions): HeroHandle {
  const { reduce } = opts;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 0.9;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);

  const scene = new THREE.Scene();
  const pmrem = keep(new THREE.PMREMGenerator(renderer));
  const env = keep(pmrem.fromScene(new RoomEnvironment(), 0.04).texture);
  scene.environment = env;

  const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 50);
  const ELEV = (16 * Math.PI) / 180;
  const DIST = 9.6;
  const TARGET = new THREE.Vector3(0, 1.2, 0);
  camera.position.set(0, TARGET.y + DIST * Math.sin(ELEV), DIST * Math.cos(ELEV));
  camera.lookAt(TARGET);

  const key = new THREE.DirectionalLight(0xffffff, 1.6);
  key.position.set(-1.5, 8, 2.5);
  key.castShadow = true;
  key.shadow.mapSize.set(1024, 1024);
  key.shadow.camera.left = key.shadow.camera.bottom = -3;
  key.shadow.camera.right = key.shadow.camera.top = 3;
  key.shadow.radius = 6;
  key.shadow.bias = -0.0005;
  scene.add(key);

  // Massing: one neutral grey, the blue only where it will live.
  const grey = keep(new THREE.MeshStandardMaterial({ color: 0xb4bdcc, metalness: 0.35, roughness: 0.4 }));
  const greyDark = keep(new THREE.MeshStandardMaterial({ color: 0x5d7092, metalness: 0.35, roughness: 0.45 }));
  const ink = keep(new THREE.MeshStandardMaterial({ color: 0x22355a, metalness: 0.4, roughness: 0.38 }));
  const blue = keep(new THREE.MeshStandardMaterial({ color: 0x234d9e, metalness: 0.3, roughness: 0.35 }));
  const pale = keep(new THREE.MeshStandardMaterial({ color: 0xf2f5fa, metalness: 0, roughness: 0.6 }));

  const root = new THREE.Group();
  scene.add(root);
  const add = (g: THREE.BufferGeometry, m: THREE.Material, parent: THREE.Object3D = root) => {
    const mesh = new THREE.Mesh(keep(g), m);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    parent.add(mesh);
    return mesh;
  };

  // Ground: a shadow catcher only.
  const ground = new THREE.Mesh(keep(new THREE.PlaneGeometry(8, 8)), keep(new THREE.ShadowMaterial({ opacity: 0.12 })));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  /* "The Gimbal": an open instrument frame. A foot and column carry a
     yoke; the yoke carries the meridian ring on its axis; the meridian
     carries the station ring on two gimbal pins. Eleven stations ride
     the station ring, each with a probe reaching in to the core. Above
     the core, the seal: a plate with one aperture, and a spindle up
     through it to the crown, which is the only way out. */
  const C = 1.32; // centre height
  const RM = 1.0; // meridian radius
  const RS = 0.86; // station ring radius

  /** A flat ring with a rectangular section, in the xy plane, centred. */
  const ringXY = (r0: number, r1: number, depth: number, ch = 0.008) => {
    const s0 = new THREE.Shape();
    s0.absarc(0, 0, r1, 0, Math.PI * 2, false);
    const hole = new THREE.Path();
    hole.absarc(0, 0, r0, 0, Math.PI * 2, true);
    s0.holes.push(hole);
    const g = new THREE.ExtrudeGeometry(s0, { depth: depth - 2 * ch, bevelEnabled: true, bevelThickness: ch, bevelSize: ch, bevelOffset: -ch, bevelSegments: 1, curveSegments: 160 });
    g.translate(0, 0, -(depth - 2 * ch) / 2);
    g.computeVertexNormals();
    return g;
  };

  // Foot and column.
  const foot = new THREE.LatheGeometry(
    [new THREE.Vector2(0, 0), new THREE.Vector2(0.5, 0), new THREE.Vector2(0.52, 0.02), new THREE.Vector2(0.52, 0.05), new THREE.Vector2(0.46, 0.08), new THREE.Vector2(0.09, 0.1), new THREE.Vector2(0.06, 0.16), new THREE.Vector2(0.05, C - RM - 0.12), new THREE.Vector2(0, C - RM - 0.12)],
    96
  );
  add(foot, grey);
  // Yoke: a short cradle under the meridian.
  const yoke = ringXY(RM + 0.03, RM + 0.09, 0.1);
  const ym = add(yoke, ink);
  ym.position.set(0, C, 0);
  ym.scale.set(1, 1, 1);
  ym.visible = false;
  const cradle = new THREE.BoxGeometry(0.34, 0.06, 0.12);
  add(cradle, ink).position.set(0, C - RM - 0.09, 0);

  // Meridian: a vertical ring in the xy plane.
  const merid = add(ringXY(RM - 0.06, RM, 0.09), grey);
  merid.position.set(0, C, 0);

  // Station ring on two gimbal pins at ±x.
  const station = new THREE.Group();
  station.position.set(0, C, 0);
  root.add(station);
  const sr = add(ringXY(RS - 0.07, RS, 0.06), ink, station);
  sr.rotation.x = Math.PI / 2;
  for (const sx of [-1, 1]) {
    const pin = new THREE.CylinderGeometry(0.03, 0.03, RM - RS + 0.04, 24);
    pin.rotateZ(Math.PI / 2);
    add(pin, greyDark, station).position.set(sx * (RS + (RM - RS) / 2 - 0.02), 0, 0);
  }

  // Eleven stations: a carriage on the ring and a probe to the core.
  const segments: THREE.Group[] = [];
  for (let k = 0; k < N; k++) {
    const t = (k + 0.5) * STEP;
    const grp = new THREE.Group();
    grp.rotation.y = t;
    station.add(grp);
    add(new THREE.BoxGeometry(0.1, 0.12, 0.14), grey, grp).position.set(RS - 0.035, 0, 0);
    const probe = new THREE.CylinderGeometry(0.012, 0.012, RS - 0.36, 12);
    probe.rotateZ(Math.PI / 2);
    add(probe, greyDark, grp).position.set((RS + 0.36) / 2 - 0.04, 0, 0);
    add(new THREE.BoxGeometry(0.05, 0.05, 0.05), ink, grp).position.set(0.34, 0, 0);
    grp.userData.dir = new THREE.Vector3(Math.cos(t), 0, -Math.sin(t));
    segments.push(grp);
  }

  // Core: the codebase as a small stack of thin square plates.
  const core = new THREE.Group();
  core.position.set(0, C, 0);
  root.add(core);
  for (let i = 0; i < 6; i++) {
    const g = new THREE.BoxGeometry(0.5, 0.02, 0.5);
    const m = add(g, i === 5 ? blue : pale, core);
    m.position.y = -0.11 + i * 0.044;
    m.rotation.y = Math.PI / 4;
  }

  // Seal plate above the core, with one aperture; spindle to the crown.
  const cap = new THREE.Group();
  cap.position.set(0, C, 0);
  root.add(cap);
  const seal = ringXY(0.04, 0.3, 0.02);
  const sm = add(seal, grey, cap);
  sm.rotation.x = Math.PI / 2;
  sm.position.y = 0.5;
  add(new THREE.CylinderGeometry(0.014, 0.014, RM - 0.5, 12), greyDark, cap).position.y = 0.5 + (RM - 0.5) / 2;
  const crown = new THREE.CylinderGeometry(0.09, 0.11, 0.08, 48);
  add(crown, ink, cap).position.y = RM + 0.02;
  const cardMesh = add(new THREE.BoxGeometry(0.16, 0.012, 0.11), blue, cap);
  cardMesh.position.y = RM + 0.075;
  const port = new THREE.Group();
  const hatch = new THREE.Group();
  void port;
  void hatch;
  void cardMesh;

  /* ── state ─────────────────────────────────────────── */
  const IDLE = (2 * Math.PI) / 50; // rad/s
  let yaw = -0.5;
  let vYaw = reduce ? 0 : IDLE;
  let open = 0;
  let openTarget = 0;
  let active = false;
  let raf = 0;
  let dead = false;
  let dragging = false;
  let lastX = 0;
  let lastT = 0;
  let posed = false;

  function layout() {
    const r = host.getBoundingClientRect();
    if (!r.width || !r.height) return;
    const dpr = Math.min(devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr);
    renderer.setSize(r.width, r.height, false);
    camera.aspect = r.width / r.height;
    camera.updateProjectionMatrix();
  }

  function render() {
    root.rotation.y = yaw;
    const e = open * open * (3 - 2 * open);
    for (const s of segments) s.children.forEach((c, i) => { if (i > 0) c.position.x = (i === 1 ? (RS + 0.36) / 2 - 0.04 : 0.34) - 0.12 * e * (i === 1 ? 0.5 : 1); });
    core.children.forEach((c, i) => (c.position.y = -0.11 + i * (0.044 + 0.03 * e)));
    cap.position.y = C + 0.06 * e;
    renderer.render(scene, camera);
  }

  let prev = performance.now();
  function loop(now: number) {
    raf = 0;
    if (dead) return;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    if (!posed) {
      if (!dragging) {
        // Ease back into the idle turntable from whatever the hand left.
        const target = reduce ? 0 : IDLE;
        vYaw += (target - vYaw) * (1 - Math.exp(-dt * 1.6));
      }
      yaw += vYaw * dt;
      const so = 3.2;
      open += Math.sign(openTarget - open) * Math.min(Math.abs(openTarget - open), dt * so * 0.5);
    }
    render();
    if (active && !posed && (!reduce || dragging || open !== openTarget || Math.abs(vYaw) > 1e-4)) raf = requestAnimationFrame(loop);
  }
  function wake() {
    if (dead || !active || raf) return;
    prev = performance.now();
    raf = requestAnimationFrame(loop);
  }

  const onDown = (e: PointerEvent) => {
    dragging = true;
    posed = false;
    lastX = e.clientX;
    lastT = performance.now();
    host.setPointerCapture(e.pointerId);
    wake();
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const now = performance.now();
    const dx = e.clientX - lastX;
    const dt = Math.max(1, now - lastT) / 1000;
    const d = dx * 0.008;
    yaw += d;
    vYaw = vYaw * 0.4 + (d / dt) * 0.6;
    lastX = e.clientX;
    lastT = now;
    wake();
  };
  const onUp = () => {
    dragging = false;
    wake();
  };
  const onEnter = () => {
    openTarget = 1;
    wake();
  };
  const onLeave = () => {
    openTarget = 0;
    wake();
  };
  host.addEventListener("pointerdown", onDown);
  host.addEventListener("pointermove", onMove);
  host.addEventListener("pointerup", onUp);
  host.addEventListener("pointercancel", onUp);
  host.addEventListener("pointerenter", onEnter);
  host.addEventListener("pointerleave", onLeave);

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
    },
    nudge(d) {
      vYaw += d * 3;
      wake();
    },
    toggleOpen() {
      openTarget = openTarget ? 0 : 1;
      wake();
    },
    setFocusOpen(v) {
      openTarget = v ? 1 : 0;
      wake();
    },
    pose(y, o) {
      posed = true;
      yaw = y;
      open = o;
      render();
    },
    state() {
      return { yaw, vYaw, open, running: raf !== 0 };
    },
    dispose() {
      dead = true;
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      host.removeEventListener("pointerdown", onDown);
      host.removeEventListener("pointermove", onMove);
      host.removeEventListener("pointerup", onUp);
      host.removeEventListener("pointercancel", onUp);
      host.removeEventListener("pointerenter", onEnter);
      host.removeEventListener("pointerleave", onLeave);
      for (const d of disposables) d.dispose();
      renderer.dispose();
      canvas.remove();
    },
  };
}
