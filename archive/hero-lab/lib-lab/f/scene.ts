import * as THREE from "three";
import { HorizontalBlurShader } from "three/examples/jsm/shaders/HorizontalBlurShader.js";
import { VerticalBlurShader } from "three/examples/jsm/shaders/VerticalBlurShader.js";
import { studioScene } from "./studio";
import { MODULE_NAMES, PART_TEXT, type PartKey } from "./parts";
import { codeTexture, findingBlueTexture, flycutTexture, lensTexture } from "./textures";

/* ══════════════════════════════════════════════════════════
   Designer F, round 4: "The Reader". Legibility first.

   One sealed enclosure on a long base. Left to right:
     a sheet of code enters a slot at the left end;
     eleven windows along the lid light one after another as it is read;
     a single finding, a small report card, slides out at the right end.
   The lid never opens: the seam all round is the seal, and a blue seal
   crosses it on each long face. Nothing else is on the object.

   Units: y is up, the base stands on y = 0, x is the flow (left → right).
   ══════════════════════════════════════════════════════════ */

export const N = 11;
export const PITCH = 0.16;
export const xs = (i: number) => (i - (N - 1) / 2) * PITCH;

/** The instrument: about 2.2 : 1 length to height, flat top, crisp edges. */
const BODY = { l: 2.4, w: 1.04, y0: 0.045, seam: 0.7, y1: 1.1, r: 0.05, ch: 0.022 };
/** A thin, precise plate, with a machined channel the sheet and card ride in. */
const BASE = { x0: -2.28, x1: 2.12, w: 1.36, h: 0.045, r: 0.05 };
const CHANNEL_W = 0.92;
const CODE = { l: 2.0, w: 0.8, t: 0.012 };
const CARD = { l: 0.66, w: 0.8, t: 0.026 };
const LENS_R = 0.052;
const STRIP = { l: N * PITCH + 0.1, w: 0.2, z: 0.18 };
const SLOT_Y = BASE.h;
const CODE_X0 = BASE.x0 + 0.04;
const CODE_FEED = 0.32;
const CARD_X_IN = BODY.l / 2 - CARD.l / 2 - 0.02;
const CARD_X_OUT = BODY.l / 2 + CARD.l / 2 + 0.05;
const STRAP_X = 1.02;

/* Timeline (seconds): feed, then the eleven checks, then the finding. */
const T_FEED = 0.7;
const T_CELL = 0.22;
const T_CHECKS = T_CELL * N + 0.3;
const T_OUT = 0.8;
const T_END = T_FEED + T_CHECKS + T_OUT;

export interface PartHit {
  key: PartKey;
  station?: number;
  title: string;
  body: string;
  x: number;
  y: number;
}
export interface LabelEls {
  code: HTMLElement;
  modules: HTMLElement;
  sealed: HTMLElement;
  finding: HTMLElement;
}
export interface MountOptions {
  reduce: boolean;
  coarse: boolean;
  labels: LabelEls | null;
  onPart: (part: PartHit | null) => void;
  onReady: () => void;
}
export interface HeroHandle {
  setActive(active: boolean): void;
  nudge(dyaw: number): void;
  toggleOpen(): void;
  setOpen(open: boolean): void;
  /** Test hooks: pose(yaw, t) with t the sequence position 0..1; -1 = at rest (done). */
  pose(yaw: number, t: number, labels?: boolean): void;
  state(): { yaw: number; vYaw: number; t: number; open: boolean; running: boolean };
  findPart(kind: "station"): { x: number; y: number };
  dispose(): void;
}

/* ── shapes ─────────────────────────────────────────────── */

function roundRect(L: number, W: number, r: number, cx = 0, cz = 0) {
  const s = new THREE.Shape();
  const x0 = cx - L / 2, x1 = cx + L / 2, y0 = -cz - W / 2, y1 = -cz + W / 2;
  s.moveTo(x0 + r, y0);
  s.lineTo(x1 - r, y0);
  s.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  s.lineTo(x1, y1 - r);
  s.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  s.lineTo(x0 + r, y1);
  s.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  s.lineTo(x0, y0 + r);
  s.absarc(x0 + r, y0 + r, r, Math.PI, 1.5 * Math.PI, false);
  return s;
}

function rrPath(L: number, W: number, r: number, cx = 0, cz = 0) {
  const p = new THREE.Path();
  const x0 = cx - L / 2, x1 = cx + L / 2, y0 = -cz - W / 2, y1 = -cz + W / 2;
  p.moveTo(x0 + r, y0);
  p.lineTo(x1 - r, y0);
  p.absarc(x1 - r, y0 + r, r, -Math.PI / 2, 0, false);
  p.lineTo(x1, y1 - r);
  p.absarc(x1 - r, y1 - r, r, 0, Math.PI / 2, false);
  p.lineTo(x0 + r, y1);
  p.absarc(x0 + r, y1 - r, r, Math.PI / 2, Math.PI, false);
  p.lineTo(x0, y0 + r);
  p.absarc(x0 + r, y0 + r, r, Math.PI, 1.5 * Math.PI, false);
  return p;
}

function slab(shape: THREE.Shape, y0: number, y1: number, ch = 0.012, seg = 3) {
  const g = new THREE.ExtrudeGeometry(shape, {
    depth: Math.max(1e-4, y1 - y0 - 2 * ch),
    bevelEnabled: ch > 0,
    bevelThickness: ch,
    bevelSize: ch,
    bevelOffset: -ch,
    bevelSegments: seg,
    curveSegments: 40,
  });
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0 + ch, 0);
  g.computeVertexNormals();
  return g;
}

const ease = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * x * (x * (x * 6 - 15) + 10);
};
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export function mount(host: HTMLElement, opts: MountOptions): HeroHandle {
  const { reduce, coarse, labels } = opts;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;
  const canvas = renderer.domElement;
  canvas.setAttribute("aria-hidden", "true");
  host.appendChild(canvas);

  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(x: T) => (disposables.push(x), x);
  const aniso = renderer.capabilities.getMaxAnisotropy();

  const scene = new THREE.Scene();
  const pmrem = keep(new THREE.PMREMGenerator(renderer));
  {
    const studio = studioScene();
    scene.environment = keep(pmrem.fromScene(studio.scene, 0.0).texture);
    studio.dispose();
  }
  scene.environmentIntensity = 0.62;

  const camera = new THREE.PerspectiveCamera(20, 1, 0.1, 60);
  const ELEV = (28 * Math.PI) / 180;
  const DIST = 16.6;
  const TARGET = new THREE.Vector3(0.2, 0.5, 0);
  camera.position.set(TARGET.x, TARGET.y + DIST * Math.sin(ELEV), DIST * Math.cos(ELEV));
  camera.lookAt(TARGET);

  const key = new THREE.DirectionalLight(0xffffff, 2.3);
  key.position.set(-3.2, 8, 0.6);
  key.castShadow = true;
  key.shadow.mapSize.set(2048, 2048);
  key.shadow.camera.left = key.shadow.camera.bottom = -2.6;
  key.shadow.camera.right = key.shadow.camera.top = 2.6;
  key.shadow.camera.near = 2;
  key.shadow.camera.far = 16;
  key.shadow.bias = -0.0004;
  key.shadow.normalBias = 0.012;
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xdfe8ff, 0.9);
  rim.position.set(3, 3, -5);
  scene.add(rim);

  /* ── materials: anodised navy, satin steel, white, one light ── */
  const flycut = keep(flycutTexture(aniso));
  const navyTop = keep(
    new THREE.MeshPhysicalMaterial({
      color: 0x0b3785,
      metalness: 0.68,
      roughness: 0.3,
      clearcoat: 0.12,
      clearcoatRoughness: 0.18,
      anisotropy: 0.55,
      anisotropyMap: flycut,
    })
  );
  const navySide = keep(new THREE.MeshPhysicalMaterial({ color: 0x0b3785, metalness: 0.6, roughness: 0.36, clearcoat: 0.25, clearcoatRoughness: 0.2 }));
  const NAVY = [navyTop, navySide];
  const satinTop = keep(new THREE.MeshPhysicalMaterial({ color: 0xb4bdcc, metalness: 0.4, roughness: 0.42, anisotropy: 0.3 }));
  const satinSide = keep(new THREE.MeshStandardMaterial({ color: 0xb4bdcc, metalness: 0.4, roughness: 0.42 }));
  const SATIN = [satinTop, satinSide];
  const steel = keep(new THREE.MeshStandardMaterial({ color: 0xdfe4ec, metalness: 1, roughness: 0.16, envMapIntensity: 1.2 }));
  const recess = keep(new THREE.MeshStandardMaterial({ color: 0x0c1630, metalness: 0.2, roughness: 0.8 }));
  const paper = keep(new THREE.MeshStandardMaterial({ color: 0xf4f6fa, metalness: 0, roughness: 0.6 }));
  const sealBlue = keep(new THREE.MeshPhysicalMaterial({ color: 0x234d9e, metalness: 0.6, roughness: 0.25, clearcoat: 0.3 }));
  const cardEdge = keep(new THREE.MeshPhysicalMaterial({ color: 0x1d438f, metalness: 0.3, roughness: 0.3, clearcoat: 0.6, clearcoatRoughness: 0.15 }));
  const codeMat = keep(new THREE.MeshStandardMaterial({ map: keep(codeTexture(aniso, CODE.l, CODE.w)), metalness: 0, roughness: 0.6 }));
  const cardMat = keep(new THREE.MeshPhysicalMaterial({ map: keep(findingBlueTexture(aniso, CARD.l, CARD.w)), metalness: 0.1, roughness: 0.35, clearcoat: 0.5, clearcoatRoughness: 0.2 }));

  const root = new THREE.Group();
  scene.add(root);
  const add = (g: THREE.BufferGeometry, m: THREE.Material | THREE.Material[], parent: THREE.Object3D, part?: PartKey, shadow = true) => {
    const mesh = new THREE.Mesh(keep(g), m);
    mesh.castShadow = shadow;
    mesh.receiveShadow = true;
    if (part) mesh.userData.part = part;
    parent.add(mesh);
    return mesh;
  };

  /* ── the plate, with a machined channel along the flow ─── */
  const BASE_C = (BASE.x0 + BASE.x1) / 2;
  add(slab(roundRect(BASE.x1 - BASE.x0, BASE.w, BASE.r, BASE_C), 0, BASE.h, 0.008, 1), SATIN, root, "sealed");
  // The channel: two fine machined grooves either side of the flow path.
  for (const sz of [-1, 1]) add(new THREE.BoxGeometry(BASE.x1 - BASE.x0 - 0.16, 0.002, 0.006), recess, root, "sealed", false).position.set(BASE_C, BASE.h + 0.0005, sz * (CHANNEL_W / 2));

  /* ── the sealed instrument: base, split line, lid ────────── */
  add(slab(roundRect(BODY.l, BODY.w, BODY.r), BODY.y0, BODY.seam - 0.006, BODY.ch, 2), NAVY, root, "sealed");
  add(slab(roundRect(BODY.l - 0.024, BODY.w - 0.024, BODY.r), BODY.seam - 0.012, BODY.seam + 0.012, 0), recess, root, "sealed", false);
  add(slab(roundRect(BODY.l - 0.03, BODY.w - 0.03, BODY.r), BODY.seam + 0.006, BODY.y1, BODY.ch, 2), NAVY, root, "sealed");
  // A machined panel line on each long face of the base: the one detail
  // that says "instrument", not "box".
  for (const sz of [-1, 1]) {
    const pw = 1.9, ph = 0.42, px = -0.12, py = (BODY.y0 + BODY.seam) / 2;
    const outer = new THREE.Shape();
    outer.copy(roundRect(pw, ph, 0.03, px, -py));
    outer.holes.push(rrPath(pw - 0.008, ph - 0.008, 0.026, px, -py));
    const g = new THREE.ShapeGeometry(outer, 24);
    const m = add(g, recess, root, "sealed", false);
    m.position.z = sz * (BODY.w / 2 + 0.0008);
    if (sz < 0) m.rotation.y = Math.PI;
  }

  // The seal: a steel band over the lid and across the split line, and a
  // machined seal boss on it with a padlock standing proud of its face.
  {
    const sw = 0.07, st = 0.007;
    const LW = BODY.w - 0.03;
    add(slab(roundRect(sw, LW + 2 * st, 0.003, STRAP_X), BODY.y1 - 0.003, BODY.y1 + st, 0.002, 1), steel, root, "seal");
    for (const sz of [-1, 1]) {
      const lo = new THREE.BoxGeometry(sw, BODY.seam - BODY.y0 - 0.03, st);
      add(lo, steel, root, "seal").position.set(STRAP_X, (BODY.seam + BODY.y0 + 0.03) / 2, sz * (BODY.w / 2 + st / 2 - 0.001));
      const hi = new THREE.BoxGeometry(sw, BODY.y1 - BODY.seam, st);
      add(hi, steel, root, "seal").position.set(STRAP_X, (BODY.y1 + BODY.seam) / 2, sz * (LW / 2 + st / 2 - 0.001));
      const boss = new THREE.Group();
      boss.position.set(STRAP_X, BODY.seam, sz * (BODY.w / 2 + st));
      if (sz < 0) boss.rotation.y = Math.PI;
      root.add(boss);
      // Boss: a turned steel collar, a blue anodised face, a raised padlock.
      const collar = new THREE.CylinderGeometry(0.105, 0.112, 0.03, 72);
      collar.rotateX(Math.PI / 2);
      add(collar, steel, boss, "seal").position.z = 0.015;
      const face = new THREE.CylinderGeometry(0.084, 0.084, 0.034, 72);
      face.rotateX(Math.PI / 2);
      add(face, sealBlue, boss, "seal").position.z = 0.017;
      const body = slab(roundRect(0.07, 0.052, 0.01), 0, 0.012, 0.003, 2);
      body.rotateX(Math.PI / 2);
      add(body, steel, boss, "seal").position.set(0, -0.016, 0.034 + 0.012);
      const shackle = new THREE.TorusGeometry(0.02, 0.0055, 16, 32, Math.PI);
      add(shackle, steel, boss, "seal").position.set(0, 0.012, 0.04);
      for (const sx of [-1, 1]) {
        const leg = new THREE.CylinderGeometry(0.0055, 0.0055, 0.014, 16);
        add(leg, steel, boss, "seal").position.set(sx * 0.02, 0.005, 0.04);
      }
    }
  }
  // Slots: the way in (left) and the only way out (right), at plate level,
  // each under a steel lip.
  for (const sx of [-1, 1]) {
    const w = sx < 0 ? CODE.w + 0.06 : CARD.w + 0.06;
    add(new THREE.BoxGeometry(0.006, 0.06, w), recess, root, sx < 0 ? "code" : "finding", false).position.set(sx * (BODY.l / 2 + 0.001), SLOT_Y + 0.03, 0);
    add(slab(roundRect(0.04, w + 0.06, 0.008, sx * (BODY.l / 2 + 0.01)), SLOT_Y + 0.06, SLOT_Y + 0.085, 0.004, 1), steel, root, sx < 0 ? "code" : "finding");
  }

  /* ── the eleven lenses, in an inlaid steel strip on the lid ── */
  const cellMats: THREE.MeshPhysicalMaterial[] = [];
  {
    const lensTex = keep(lensTexture());
    // The inlay: flush steel, with a hairline recess around it.
    add(slab(roundRect(STRIP.l + 0.016, STRIP.w + 0.016, 0.03, 0, STRIP.z), BODY.y1 - 0.004, BODY.y1 + 0.0006, 0, 1), recess, root, "modules", false);
    // Lens wells: dark, so an unread lens reads as glass in a bore.
    {
      const sh = roundRect(STRIP.l, STRIP.w, 0.024, 0, STRIP.z);
      for (let i = 0; i < N; i++) {
        const h = new THREE.Path();
        h.absarc(xs(i), -STRIP.z, LENS_R + 0.012, 0, Math.PI * 2, true);
        sh.holes.push(h);
      }
      add(slab(sh, BODY.y1 - 0.004, BODY.y1 + 0.0016, 0.0012, 1), steel, root, "modules", false);
    }
    for (let i = 0; i < N; i++) {
      const m = keep(
        new THREE.MeshPhysicalMaterial({
          color: 0x081634,
          metalness: 0.1,
          roughness: 0.08,
          clearcoat: 1,
          clearcoatRoughness: 0.05,
          emissive: 0x6f92d7,
          emissiveMap: lensTex,
          emissiveIntensity: 0,
        })
      );
      cellMats.push(m);
      // A turned bezel, a recess, and the lens just below the strip face.
      const bezel = new THREE.Shape();
      bezel.absarc(xs(i), -STRIP.z, LENS_R + 0.012, 0, Math.PI * 2, false);
      const hole = new THREE.Path();
      hole.absarc(xs(i), -STRIP.z, LENS_R, 0, Math.PI * 2, true);
      bezel.holes.push(hole);
      add(slab(bezel, BODY.y1 - 0.003, BODY.y1 + 0.006, 0.0025, 2), steel, root, "station", false).userData.station = i;
      const lens = new THREE.CylinderGeometry(LENS_R + 0.006, LENS_R + 0.006, 0.0012, 48);
      const lm = add(lens, m, root, "station", false);
      lm.position.set(xs(i), BODY.y1 + 0.0004, STRIP.z);
      lm.rotation.y = Math.PI / 2;
      lm.userData.station = i;
    }
  }

  /* ── the code sheet and the finding card ──────────────────── */
  const code = new THREE.Group();
  root.add(code);
  {
    const top = new THREE.PlaneGeometry(CODE.l, CODE.w).rotateX(-Math.PI / 2);
    add(top, codeMat, code, "code", false).position.set(CODE.l / 2, CODE.t + 0.0005, 0);
    add(new THREE.BoxGeometry(CODE.l, CODE.t, CODE.w), paper, code, "code").position.set(CODE.l / 2, CODE.t / 2, 0);
  }
  const card = new THREE.Group();
  root.add(card);
  {
    const top = new THREE.PlaneGeometry(CARD.l - 0.012, CARD.w - 0.012).rotateX(-Math.PI / 2);
    add(top, cardMat, card, "finding", false).position.set(0, CARD.t + 0.0006, 0);
    add(slab(roundRect(CARD.l, CARD.w, 0.03), 0, CARD.t, 0.006, 2), cardEdge, card, "finding");
  }

  /* ── contact shadow (blurred top-down depth) ─────────────── */
  const CS = { w: 5.4, h: 5.4, depth: 0.8, res: 512, blur: 2.6, opacity: 0.8 };
  const csRT = keep(new THREE.WebGLRenderTarget(CS.res, CS.res));
  const csBlurRT = keep(new THREE.WebGLRenderTarget(CS.res, CS.res));
  csRT.texture.generateMipmaps = csBlurRT.texture.generateMipmaps = false;
  const csPlaneGeo = keep(new THREE.PlaneGeometry(CS.w, CS.h).rotateX(Math.PI / 2));
  const csPlane = new THREE.Mesh(
    csPlaneGeo,
    keep(new THREE.MeshBasicMaterial({ map: csRT.texture, transparent: true, opacity: CS.opacity, depthWrite: false, color: 0x0a1838 }))
  );
  csPlane.renderOrder = 1;
  csPlane.scale.y = -1;
  csPlane.position.y = 0.001;
  scene.add(csPlane);
  const csBlurPlane = new THREE.Mesh(csPlaneGeo);
  csBlurPlane.visible = false;
  scene.add(csBlurPlane);
  const csCam = new THREE.OrthographicCamera(-CS.w / 2, CS.w / 2, CS.h / 2, -CS.h / 2, 0, CS.depth);
  csCam.rotation.x = Math.PI / 2;
  scene.add(csCam);
  const csDepth = keep(new THREE.MeshDepthMaterial());
  csDepth.onBeforeCompile = (shader) => {
    shader.fragmentShader = shader.fragmentShader.replace(
      "gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );",
      "gl_FragColor = vec4( vec3( 1.0 ), pow( 1.0 - fragCoordZ, 1.2 ) );"
    );
  };
  csDepth.depthTest = false;
  csDepth.depthWrite = false;
  const hBlur = keep(new THREE.ShaderMaterial(HorizontalBlurShader));
  const vBlur = keep(new THREE.ShaderMaterial(VerticalBlurShader));
  hBlur.depthTest = vBlur.depthTest = false;
  let csKey = "";
  function blurCS(amount: number) {
    csBlurPlane.visible = true;
    csBlurPlane.material = hBlur;
    hBlur.uniforms.tDiffuse.value = csRT.texture;
    hBlur.uniforms.h.value = amount / 256;
    renderer.setRenderTarget(csBlurRT);
    renderer.render(csBlurPlane, csCam);
    csBlurPlane.material = vBlur;
    vBlur.uniforms.tDiffuse.value = csBlurRT.texture;
    vBlur.uniforms.v.value = amount / 256;
    renderer.setRenderTarget(csRT);
    renderer.render(csBlurPlane, csCam);
    csBlurPlane.visible = false;
  }
  function renderContactShadow() {
    const k = `${yaw.toFixed(4)}|${t.toFixed(3)}`;
    if (k === csKey) return;
    csKey = k;
    csPlane.visible = false;
    scene.overrideMaterial = csDepth;
    const clear = renderer.getClearAlpha();
    renderer.setClearAlpha(0);
    renderer.setRenderTarget(csRT);
    renderer.clear();
    renderer.render(scene, csCam);
    scene.overrideMaterial = null;
    blurCS(CS.blur);
    blurCS(CS.blur * 0.45);
    renderer.setRenderTarget(null);
    renderer.setClearAlpha(clear);
    csPlane.visible = true;
  }

  /* ── state ─────────────────────────────────────────────── */
  const IDLE = (2 * Math.PI) / 50;
  /** The angle the die turns to while it explains itself: three-quarter
      front, the way in on the left, the way out on the right. */
  const PRESENT = -0.38;
  let yaw = -0.5;
  let vYaw = 0;
  /** Sequence time: 0 = empty (sheet out, windows dark, card in), T_END = done. */
  let t = reduce ? T_END : 0;
  let playing = !reduce; // the first visit plays it once
  let open = false;
  let labelsOn = 0;
  let active = false;
  let raf = 0;
  let dead = false;
  let dragging = false;
  let moved = 0;
  let downX = 0;
  let downY = 0;
  let lastX = 0;
  let lastT = 0;
  let posed = false;
  let forceLabels = false;
  const born = performance.now();

  function layout() {
    const c = canvas.getBoundingClientRect();
    if (!c.width || !c.height) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 2));
    renderer.setSize(c.width, c.height, false);
    camera.aspect = c.width / c.height;
    camera.fov = camera.aspect < 1.15 ? 20 * Math.min(1.4, 1.15 / camera.aspect) : 20;
    camera.updateProjectionMatrix();
  }

  const anchors: [keyof LabelEls, THREE.Vector3][] = [
    ["code", new THREE.Vector3(BASE.x0 + 0.42, 0.07, 0.05)],
    ["modules", new THREE.Vector3(xs(7), BODY.y1 + 0.01, STRIP.z)],
    ["sealed", new THREE.Vector3(STRAP_X, BODY.seam - 0.13, BODY.w / 2 + 0.03)],
    ["finding", new THREE.Vector3(CARD_X_OUT + 0.1, 0.08, 0)],
  ];
  const v3 = new THREE.Vector3();
  function placeLabels() {
    if (!labels) return;
    const c = canvas.getBoundingClientRect();
    const h = host.getBoundingClientRect();
    for (const [k, p] of anchors) {
      const el = labels[k];
      v3.copy(p);
      root.localToWorld(v3);
      v3.project(camera);
      const x = c.left - h.left + ((v3.x + 1) / 2) * c.width;
      const y = c.top - h.top + ((1 - v3.y) / 2) * c.height;
      el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
      el.style.opacity = labelsOn.toFixed(3);
    }
  }

  function render() {
    root.rotation.y = yaw;
    // Feed: the sheet slides in while the first windows read.
    const feed = ease(t / (T_FEED + T_CELL * 3));
    code.position.set(CODE_X0 + CODE_FEED * feed, BASE.h, 0);
    // Checks: each window lights as its share of the sheet passes under it,
    // then settles to a calm "done".
    const tc = t - T_FEED;
    for (let i = 0; i < N; i++) {
      const u = (tc - i * T_CELL) / T_CELL;
      // Unread: dark. Reading: a bright pulse. Read: a calm, steady blue.
      // Unread: dark glass. Reading: the whole lens lights. Done: the etched
      // check stays lit, the fill falls back.
      const on = u < 0 ? 0 : u < 1 ? 1.2 + 3.2 * Math.sin(clamp01(u) * Math.PI) : 1.5;
      cellMats[i].emissiveIntensity = on;
      cellMats[i].emissive.setHex(u >= 0 && u < 1 ? 0xb9cdf5 : 0x7fa2e6);
    }
    // The finding slides out of the only exit.
    const out = ease((t - T_FEED - T_CHECKS) / T_OUT);
    card.position.set(CARD_X_IN + (CARD_X_OUT - CARD_X_IN) * out, BASE.h + 0.004, 0);
    renderContactShadow();
    renderer.render(scene, camera);
    placeLabels();
  }

  let prev = performance.now();
  function loop(now: number) {
    raf = 0;
    if (dead) return;
    const dt = Math.min(0.05, (now - prev) / 1000);
    prev = now;
    if (!posed) {
      const idleGain = reduce ? 0 : Math.min(1, (now - born) / 1500);
      if (!dragging) {
        if (open && !reduce) {
          // Turn to the presentation angle and hold it while it explains.
          const k = Math.round((yaw - PRESENT) / (2 * Math.PI));
          const target = PRESENT + k * 2 * Math.PI;
          const ky = 1 - Math.exp(-dt * 2.2);
          vYaw = (target - yaw) * ky / Math.max(dt, 1e-3);
          vYaw = Math.max(-0.9, Math.min(0.9, vYaw));
        } else vYaw += (IDLE * idleGain - vYaw) * (1 - Math.exp(-dt * 1.4));
      }
      yaw += vYaw * dt;
      if (playing) {
        // Wait a beat after mount (or after a reset) before reading.
        const delay = now - born < 1200 ? 0 : 1;
        t = Math.min(T_END, t + dt * delay);
        if (t >= T_END) playing = false;
      }
      labelsOn += ((open || forceLabels ? 1 : 0) - labelsOn) * (1 - Math.exp(-dt * 6));
      if (Math.abs(labelsOn - (open ? 1 : 0)) < 0.002) labelsOn = open ? 1 : 0;
    }
    render();
    if (active && !posed && (!reduce || dragging || playing || Math.abs(labelsOn - (open ? 1 : 0)) > 0 || Math.abs(vYaw) > 1e-4)) raf = requestAnimationFrame(loop);
  }
  function wake() {
    if (dead || !active || raf) return;
    prev = performance.now();
    raf = requestAnimationFrame(loop);
  }

  /** Hover: name the parts, turn to face the viewer, and read again. */
  function setOpen(v: boolean) {
    posed = false;
    if (v === open) return;
    open = v;
    if (v && !reduce) {
      t = 0;
      playing = true;
    } else if (!v && !reduce && playing) {
      // Leaving mid-read: finish it, so it always rests complete.
    }
    wake();
  }

  /* ── picking ───────────────────────────────────────────── */
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function pick(clientX: number, clientY: number): PartHit | null {
    const c = canvas.getBoundingClientRect();
    ndc.set(((clientX - c.left) / c.width) * 2 - 1, -((clientY - c.top) / c.height) * 2 + 1);
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObject(root, true).find((h) => h.object.userData.part);
    if (!hit) return null;
    const key = hit.object.userData.part as PartKey;
    const station = key === "station" ? (hit.object.userData.station as number | undefined) : undefined;
    const h = host.getBoundingClientRect();
    const tx = PART_TEXT[key];
    const title = station !== undefined ? `Module ${station + 1}: ${MODULE_NAMES[station]}` : tx.title;
    return { key, station, title, body: tx.body, x: clientX - h.left, y: clientY - h.top };
  }

  const onDown = (e: PointerEvent) => {
    dragging = true;
    posed = false;
    moved = 0;
    downX = lastX = e.clientX;
    downY = e.clientY;
    lastT = performance.now();
    host.setPointerCapture(e.pointerId);
    wake();
  };
  const onMove = (e: PointerEvent) => {
    if (!dragging) return;
    const now = performance.now();
    const d = (e.clientX - lastX) * 0.008;
    moved = Math.max(moved, Math.hypot(e.clientX - downX, e.clientY - downY));
    yaw += d;
    vYaw = vYaw * 0.35 + (d / (Math.max(8, now - lastT) / 1000)) * 0.65;
    lastX = e.clientX;
    lastT = now;
    wake();
  };
  const onUp = (e: PointerEvent) => {
    if (!dragging) return;
    dragging = false;
    if (performance.now() - lastT > 80) vYaw = Math.min(Math.abs(vYaw), IDLE) * Math.sign(vYaw || 1);
    if (moved < 5) {
      const p = pick(e.clientX, e.clientY);
      if (coarse) setOpen(!open);
      opts.onPart(p);
    }
    wake();
  };
  const onEnter = (e: PointerEvent) => {
    if (e.pointerType === "mouse") setOpen(true);
  };
  const onLeave = (e: PointerEvent) => {
    if (e.pointerType === "mouse") setOpen(false);
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
      posed = false;
      vYaw += d * 3;
      wake();
    },
    toggleOpen() {
      setOpen(!open);
    },
    setOpen,
    pose(y, tt, lab = false) {
      posed = true;
      yaw = y;
      t = tt < 0 ? T_END : tt * T_END;
      labelsOn = lab ? 1 : 0;
      render();
    },
    state() {
      return { yaw, vYaw, t: t / T_END, open, running: raf !== 0 };
    },
    findPart() {
      const v = new THREE.Vector3(xs(3), BODY.y1, STRIP.z);
      root.localToWorld(v);
      v.project(camera);
      const c = canvas.getBoundingClientRect();
      return { x: c.left + ((v.x + 1) / 2) * c.width, y: c.top + ((1 - v.y) / 2) * c.height };
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
