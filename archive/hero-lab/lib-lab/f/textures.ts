import * as THREE from "three";

/* Procedural canvas textures for "The Die". Everything fine (engraving,
   the strip's stations, the ground finish) is drawn once into mipmapped
   textures, so it filters down cleanly instead of shimmering while the
   object turns. */

const N = 11;
const PITCH = 0.17;
const xs = (i: number) => (i - (N - 1) / 2) * PITCH;

/** The code strip, in world units along x (z is across the strip). */
export const STRIP = { x0: -1.52, x1: 0.98, w: 0.32, pilotZ: 0.112, pilotR: 0.017 };

function rng(seed: number) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function finish(c: HTMLCanvasElement, aniso: number, srgb = true) {
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = Math.min(16, aniso);
  t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.needsUpdate = true;
  return t;
}

/** Blanchard-ground finish: overlapping arcs of one radius, used as a
    roughness map (it only moves the sheen; no colour). Tiles. */
export function swirlTexture(aniso: number) {
  const S = 1024;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgb(232,232,232)";
  g.fillRect(0, 0, S, S);
  const r = rng(7);
  g.lineWidth = 1.6;
  for (let i = 0; i < 300; i++) {
    const cx = (i / 300) * S;
    const cy = S * 0.5 + (r() - 0.5) * 40;
    const v = 150 + Math.floor(r() * 105);
    g.strokeStyle = `rgba(${v},${v},${v},0.7)`;
    for (const dx of [-S, 0, S])
      for (const dy of [-S, 0, S]) {
        g.beginPath();
        g.arc(cx + dx, cy + dy, S * 0.62, 0, Math.PI * 2);
        g.stroke();
      }
  }
  const t = finish(c, aniso, false);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1 / 1.3, 1 / 1.3);
  return t;
}

/** The code strip: printed code rows, and the eleven progressive stages
    cut into it (transparent where material has been removed). */
export function stripTexture(aniso: number, width = 4096) {
  const L = STRIP.x1 - STRIP.x0;
  const W = width;
  const S = W / L;
  const H = Math.round(STRIP.w * S);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  // World (x, z) → canvas: z = -w/2 is the top row (the back edge).
  g.setTransform(S, 0, 0, S, -STRIP.x0 * S, (STRIP.w / 2) * S);
  g.fillStyle = "#f5f7fb";
  g.fillRect(STRIP.x0, -STRIP.w / 2, L, STRIP.w);

  // Code: short dash rows in blocks, one block per pitch cell.
  const r = rng(11);
  g.fillStyle = "#d3dae6";
  const firstCell = Math.floor((STRIP.x0 - xs(0)) / PITCH) - 1;
  for (let k = firstCell; xs(0) + k * PITCH < STRIP.x1 + PITCH; k++) {
    const cx = xs(0) + k * PITCH;
    const left = cx - PITCH / 2 + 0.014;
    const right = cx + PITCH / 2 - 0.014;
    let indent = 0;
    for (let z = -0.138; z <= 0.14; z += 0.0185) {
      if (Math.abs(Math.abs(z) - STRIP.pilotZ) < 0.012 && k >= 0) continue;
      if (r() < 0.12) continue; // a blank line
      indent = Math.max(0, Math.min(3, indent + Math.floor(r() * 3) - 1));
      let x = left + indent * 0.012;
      const words = 1 + Math.floor(r() * 3);
      for (let w = 0; w < words && x < right; w++) {
        const len = Math.min(right - x, 0.012 + r() * 0.045);
        if (len > 0.006) g.fillRect(x, z - 0.0026, len, 0.0052);
        x += len + 0.008;
      }
    }
  }

  const PART = { w: 0.128, h: 0.13, r: 0.026 };
  // Station features, cumulative left to right, as real press operations.
  // Every cut gets a faint burnish ring first, so the holes read as
  // punched sheet rather than icons.
  const path = {
    circle(x: number, z: number, r0: number) {
      g.beginPath();
      g.arc(x, z, r0, 0, Math.PI * 2);
    },
    rr(x: number, z: number, w: number, h: number, r0: number) {
      g.beginPath();
      g.roundRect(x - w / 2, z - h / 2, w, h, r0);
    },
  };
  const op = (shape: () => void) => {
    g.save();
    g.lineWidth = 0.005;
    g.strokeStyle = "rgba(150,163,186,0.55)";
    shape();
    g.stroke();
    g.globalCompositeOperation = "destination-out";
    shape();
    g.fill();
    g.restore();
  };
  const slit = (draw: () => void, w: number) => {
    g.save();
    g.globalCompositeOperation = "destination-out";
    g.lineWidth = w;
    g.lineCap = "round";
    draw();
    g.stroke();
    g.restore();
  };
  const P = PART;
  /* Fewer, larger operations; stations 3 and 7 are idle, as in a real
     progressive die (they give the punches room):
     1 pilot pierce · 2 pierce · 3 idle · 4 edge notch · 5 lance and raise
     a tab · 6 emboss a rib · 7 idle · 8 trim · 9 coin (the part turns
     blue) · 10 idle, carried · 11 blank. */
  const has = (st: number, k: number) => st >= k - 1;
  const tab = (cx: number) => {
    // A lanced U-tab, raised: the slit, a lit face rising toward the free
    // end, a crisp lit lip on the free edge and a shadow lip beyond it.
    const x0 = cx + 0.01, x1 = cx + 0.054, hw = 0.026;
    g.save();
    const gr = g.createLinearGradient(x0, 0, x1, 0);
    gr.addColorStop(0, "rgba(176,188,208,1)");
    gr.addColorStop(0.7, "rgba(232,237,245,1)");
    gr.addColorStop(1, "rgba(255,255,255,1)");
    g.fillStyle = gr;
    path.rr((x0 + x1) / 2, 0, x1 - x0, hw * 2, 0.012);
    g.fill();
    g.restore();
    slit(() => {
      g.beginPath();
      g.moveTo(x0, -hw - 0.004);
      g.lineTo(x1 - 0.012, -hw - 0.004);
      g.arcTo(x1 + 0.004, -hw - 0.004, x1 + 0.004, 0, 0.016);
      g.arcTo(x1 + 0.004, hw + 0.004, x1 - 0.012, hw + 0.004, 0.016);
      g.lineTo(x0, hw + 0.004);
    }, 0.006);
    g.save();
    g.lineCap = "round";
    // Shadow lip: just outside the slit on the far side, offset down-right.
    g.strokeStyle = "rgba(30,42,70,0.75)";
    g.lineWidth = 0.005;
    g.beginPath();
    g.moveTo(x1 - 0.004, -hw + 0.004);
    g.arcTo(x1 + 0.0105, -hw + 0.004, x1 + 0.0105, 0.012, 0.014);
    g.lineTo(x1 + 0.0105, hw - 0.002);
    g.stroke();
    // Lit lip: the free edge of the tab itself.
    g.strokeStyle = "rgba(255,255,255,1)";
    g.lineWidth = 0.0025;
    g.beginPath();
    g.moveTo(x1 - 0.012, -hw + 0.001);
    g.arcTo(x1 - 0.001, -hw + 0.001, x1 - 0.001, 0, 0.012);
    g.arcTo(x1 - 0.001, hw - 0.001, x1 - 0.012, hw - 0.001, 0.012);
    g.stroke();
    g.restore();
  };
  const rib = (cx: number) => {
    // An embossed rib across the part's left half: a crisp lit lip on its
    // upper edge, a shadow lip on its lower edge, a soft roll between.
    const x = cx - 0.038, w = 0.026, h = 0.11;
    const gr = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
    gr.addColorStop(0, "rgba(255,255,255,1)");
    gr.addColorStop(0.55, "rgba(226,231,240,1)");
    gr.addColorStop(1, "rgba(120,134,162,1)");
    g.fillStyle = gr;
    path.rr(x, 0, w, h, w / 2);
    g.fill();
    g.save();
    g.lineWidth = 0.0025;
    g.strokeStyle = "rgba(255,255,255,1)";
    g.beginPath();
    g.moveTo(x - w / 2 + 0.0015, -h / 2 + w / 2);
    g.lineTo(x - w / 2 + 0.0015, h / 2 - w / 2);
    g.stroke();
    g.strokeStyle = "rgba(30,42,70,0.75)";
    g.beginPath();
    g.moveTo(x + w / 2 + 0.002, -h / 2 + w / 2);
    g.lineTo(x + w / 2 + 0.002, h / 2 - w / 2);
    g.stroke();
    g.restore();
  };
  for (let i = 0; i < N + 1; i++) {
    const cx = xs(i);
    if (cx > STRIP.x1) break;
    const st = Math.min(i, N - 1);
    if (has(st, 2)) {
      g.fillStyle = "#f5f7fb";
      path.rr(cx, 0, P.w + 0.016, P.h + 0.016, P.r + 0.006);
      g.fill();
    }
    for (const sz of [-1, 1]) op(() => path.circle(cx, sz * STRIP.pilotZ, STRIP.pilotR));
    if (has(st, 11)) {
      op(() => path.rr(cx, 0, P.w, P.h, P.r));
      continue;
    }
    if (has(st, 4)) for (const sz of [-1, 1]) op(() => path.circle(cx + PITCH / 2, sz * (STRIP.w / 2 + 0.008), 0.034));
    if (has(st, 6)) rib(cx);
    if (has(st, 5)) tab(cx);
    // 2: the main pierce, large and round, centred on the part.
    if (has(st, 2)) op(() => path.circle(cx - 0.004, 0, 0.0165));
    if (has(st, 8)) {
      const x0 = cx - P.w / 2, x1 = cx + P.w / 2, z0 = -P.h / 2, z1 = P.h / 2, rad = P.r, t = 0.012;
      slit(() => {
        g.beginPath();
        g.moveTo(x0, -t);
        g.lineTo(x0, z0 + rad);
        g.arcTo(x0, z0, x0 + rad, z0, rad);
        g.lineTo(x1 - rad, z0);
        g.arcTo(x1, z0, x1, z0 + rad, rad);
        g.lineTo(x1, -t);
        g.moveTo(x1, t);
        g.lineTo(x1, z1 - rad);
        g.arcTo(x1, z1, x1 - rad, z1, rad);
        g.lineTo(x0 + rad, z1);
        g.arcTo(x0, z1, x0, z1 - rad, rad);
        g.lineTo(x0, t);
      }, 0.007);
    }
    if (has(st, 9)) {
      g.save();
      g.globalCompositeOperation = "source-atop";
      g.fillStyle = "#234d9e";
      path.rr(cx, 0, P.w - 0.008, P.h - 0.008, P.r - 0.004);
      g.fill();
      g.globalCompositeOperation = "source-over";
      g.lineWidth = 0.003;
      g.strokeStyle = "rgba(200,215,245,0.85)";
      path.circle(cx, 0, 0.04);
      g.stroke();
      g.restore();
    }
  }
  const t = finish(c, aniso);
  return t;
}

/** The station bar: hardened steel, ground along its length, eleven
    stations engraved with a split line, an index tick and a numeral. */
export function stationBarTexture(aniso: number) {
  const BL = N * PITCH + 0.08;
  const BW = 0.15;
  const W = 2048;
  const S = W / BL;
  const H = Math.round(BW * S);
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const grad = g.createLinearGradient(0, 0, 0, H);
  grad.addColorStop(0, "#9ba5b5");
  grad.addColorStop(1, "#a9b2c1");
  g.fillStyle = grad;
  g.fillRect(0, 0, W, H);
  const r = rng(3);
  for (let i = 0; i < 260; i++) {
    const y = r() * H;
    const v = 170 + Math.floor(r() * 80);
    g.fillStyle = `rgba(${v},${v + 4},${v + 10},0.18)`;
    g.fillRect(0, y, W, 0.8 + r() * 0.8);
  }
  g.setTransform(S, 0, 0, S, (BL / 2) * S, (BW / 2) * S);
  // Split lines between stations (engraved: a dark cut with a lit lip).
  for (let i = 0; i <= N; i++) {
    const x = xs(0) - PITCH / 2 + i * PITCH;
    g.fillStyle = "rgba(22,32,58,0.75)";
    g.fillRect(x - 0.0016, -BW / 2, 0.0032, BW);
    g.fillStyle = "rgba(255,255,255,0.7)";
    g.fillRect(x + 0.0016, -BW / 2, 0.0014, BW);
  }
  const font = getComputedStyle(document.body).fontFamily || "sans-serif";
  g.font = `500 0.034px ${font}`;
  g.textAlign = "center";
  g.textBaseline = "middle";
  for (let i = 0; i < N; i++) {
    const x = xs(i);
    // Index tick at the front edge (bottom of the texture).
    g.fillStyle = "rgba(22,32,58,0.8)";
    g.fillRect(x - 0.0014, BW / 2 - 0.034, 0.0028, 0.034);
    g.fillStyle = "rgba(52,64,92,0.6)";
    g.fillText(String(i + 1), x, -0.022);
  }
  return finish(c, aniso);
}

/** The attestation seal: a turned blue inlay, an engraved ring, and
    eleven marks, one per station. */
export function sealTexture(aniso: number) {
  const S = 512;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const m = S / 2;
  g.fillStyle = "#234d9e";
  g.fillRect(0, 0, S, S);
  for (let rr = 4; rr < m; rr += 2.2) {
    g.strokeStyle = (rr | 0) % 3 ? "rgba(255,255,255,0.05)" : "rgba(0,10,40,0.07)";
    g.lineWidth = 1;
    g.beginPath();
    g.arc(m, m, rr, 0, Math.PI * 2);
    g.stroke();
  }
  const ring = (rad: number, w: number) => {
    g.lineWidth = w;
    g.strokeStyle = "rgba(4,20,70,0.85)";
    g.beginPath();
    g.arc(m, m, rad, 0, Math.PI * 2);
    g.stroke();
    g.strokeStyle = "rgba(190,210,250,0.55)";
    g.lineWidth = w * 0.5;
    g.beginPath();
    g.arc(m, m, rad + w * 0.75, 0, Math.PI * 2);
    g.stroke();
  };
  ring(m * 0.6, 5);
  ring(m * 0.2, 4);
  for (let k = 0; k < N; k++) {
    const t = -Math.PI / 2 + (k / N) * Math.PI * 2;
    g.fillStyle = "#dfe8fb";
    g.beginPath();
    g.arc(m + Math.cos(t) * m * 0.78, m + Math.sin(t) * m * 0.78, m * 0.045, 0, Math.PI * 2);
    g.fill();
  }
  return finish(c, aniso);
}

/** Fly-cut finish as an anisotropy map: one pass of large arcs across a
    face (RG: the cut direction in tangent space, B: strength, with fine
    tool marks). Mapped once over 2.6 × 1.3 world units of face, so the
    highlight sweeps along the arcs as the die turns. */
export function flycutTexture(aniso: number) {
  const W = 1024, H = 512, U = 2.6, V = 1.3, R = 1.05;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const img = g.createImageData(W, H);
  const r = rng(5);
  // Tool marks: per-arc strength, indexed by where the arc crosses v = 0.
  const marks = new Float32Array(2048);
  for (let i = 0; i < marks.length; i++) marks[i] = 0.68 + 0.32 * r();
  for (let py = 0; py < H; py++) {
    const v = (py / H - 0.5) * V;
    const s = Math.sqrt(R * R - v * v);
    const tx = -v / R, ty = s / R;
    for (let px = 0; px < W; px++) {
      const u = (px / W - 0.5) * U;
      // The arc through (u, v) crosses v = 0 at u - s + R.
      const k = Math.floor(((u - s + R + 2) / 4) * marks.length * 0.5) & (marks.length - 1);
      const o = (py * W + px) * 4;
      img.data[o] = Math.round((tx * 0.5 + 0.5) * 255);
      img.data[o + 1] = Math.round((ty * 0.5 + 0.5) * 255);
      img.data[o + 2] = Math.round(marks[k] * 255);
      img.data[o + 3] = 255;
    }
  }
  g.putImageData(img, 0, 0);
  const t = finish(c, aniso, false);
  t.wrapS = t.wrapT = THREE.MirroredRepeatWrapping;
  t.repeat.set(1 / U, 1 / V);
  t.offset.set(0.5, 0.5);
  return t;
}

/** Diamond knurl for the feed rollers, as a bump map. */
export function knurlTexture() {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const img = g.createImageData(S, S);
  const n = 24;
  for (let y = 0; y < S; y++)
    for (let x = 0; x < S; x++) {
      const u = (x / S) * n, v = (y / S) * n * 0.5;
      const a = Math.abs(((u + v) % 1) - 0.5), b = Math.abs(((u - v + 100) % 1) - 0.5);
      const h = Math.min(a, b) * 2 * 255;
      const o = (y * S + x) * 4;
      img.data[o] = img.data[o + 1] = img.data[o + 2] = h;
      img.data[o + 3] = 255;
    }
  g.putImageData(img, 0, 0);
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.NoColorSpace;
  return t;
}

/** The codebase: a sheet printed like an editor minimap. Lines run along
    x (they read as horizontal text from the front), stacked across the
    sheet, with indents and lengths that vary like real code. */
export function codeTexture(aniso: number, L: number, W: number) {
  const PX = 2048;
  const S = PX / L;
  const c = document.createElement("canvas");
  c.width = PX;
  c.height = Math.round(W * S);
  const g = c.getContext("2d")!;
  g.setTransform(S, 0, 0, S, 0, (W / 2) * S);
  g.fillStyle = "#f7f9fc";
  g.fillRect(0, -W / 2, L, W);
  const r = rng(23);
  const ROW = 0.058;
  const BAR = 0.024;
  const PAGE = 0.62;
  g.lineCap = "round";
  for (let p = 0; p * PAGE < L; p++) {
    const left = p * PAGE + 0.05;
    let indent = 0;
    for (let z = -W / 2 + 0.05; z < W / 2 - 0.04; z += ROW) {
      if (r() < 0.08) {
        indent = 0;
        continue; // blank line between blocks
      }
      indent = Math.max(0, Math.min(3, indent + (r() < 0.35 ? 1 : r() < 0.5 ? -1 : 0)));
      let x = left + indent * 0.055;
      const end = left + PAGE - 0.09;
      const tokens = 2 + Math.floor(r() * 3);
      for (let t = 0; t < tokens && x < end; t++) {
        const len = Math.min(end - x, 0.05 + r() * (t === 0 ? 0.12 : 0.18));
        const kind = r();
        g.strokeStyle = t === 0 && kind < 0.4 ? "#234d9e" : kind < 0.55 ? "#4f78c8" : "#8794ad";
        g.lineWidth = BAR;
        g.beginPath();
        g.moveTo(x + BAR / 2, z);
        g.lineTo(x + len - BAR / 2, z);
        g.stroke();
        x += len + 0.02;
      }
    }
  }
  return finish(c, aniso);
}

/** The finding: a small report card. A blue header with the seal's ring,
    a title line, body lines, and one severity mark. */
export function findingTexture(aniso: number, L: number, W: number) {
  const PX = 768;
  const S = PX / L;
  const c = document.createElement("canvas");
  c.width = PX;
  c.height = Math.round(W * S);
  const g = c.getContext("2d")!;
  g.setTransform(S, 0, 0, S, 0, 0);
  g.fillStyle = "#fbfcfe";
  g.fillRect(0, 0, L, W);
  // Header band.
  g.fillStyle = "#234d9e";
  g.fillRect(0, 0, L, W * 0.2);
  g.strokeStyle = "rgba(255,255,255,0.9)";
  g.lineWidth = 0.008;
  g.beginPath();
  g.arc(0.07, W * 0.1, 0.032, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "rgba(255,255,255,0.85)";
  g.beginPath();
  g.roundRect(0.13, W * 0.1 - 0.012, L * 0.42, 0.024, 0.012);
  g.fill();
  // Title, body, severity.
  g.fillStyle = "#22355a";
  g.beginPath();
  g.roundRect(0.05, W * 0.28, L * 0.66, 0.03, 0.015);
  g.fill();
  g.fillStyle = "#b7c1d3";
  const rows = [0.86, 0.78, 0.9, 0.55];
  rows.forEach((f, i) => {
    g.beginPath();
    g.roundRect(0.05, W * 0.4 + i * 0.05, (L - 0.1) * f, 0.018, 0.009);
    g.fill();
  });
  g.fillStyle = "#6f92d7";
  g.beginPath();
  g.roundRect(0.05, W * 0.82, 0.11, 0.032, 0.016);
  g.fill();
  return finish(c, aniso);
}

/** A check mark, white on transparent, for a window that has finished. */
export function tickTexture() {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  g.strokeStyle = "#ffffff";
  g.lineWidth = 13;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(34, 66);
  g.lineTo(56, 88);
  g.lineTo(96, 42);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The seal on the tamper strap: a blue disc with a padlock. */
export function lockSealTexture() {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  const m = S / 2;
  g.fillStyle = "#234d9e";
  g.beginPath();
  g.arc(m, m, m, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = "rgba(255,255,255,0.35)";
  g.lineWidth = 4;
  g.beginPath();
  g.arc(m, m, m * 0.84, 0, Math.PI * 2);
  g.stroke();
  // Padlock: shackle and body.
  g.strokeStyle = "#ffffff";
  g.lineWidth = 15;
  g.beginPath();
  g.arc(m, m - 6, 30, Math.PI, 0);
  g.lineTo(m + 30, m + 8);
  g.moveTo(m - 30, m - 6);
  g.lineTo(m - 30, m + 8);
  g.stroke();
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.roundRect(m - 46, m + 4, 92, 64, 12);
  g.fill();
  g.fillStyle = "#234d9e";
  g.beginPath();
  g.arc(m, m + 30, 8, 0, Math.PI * 2);
  g.fill();
  g.fillRect(m - 4, m + 30, 8, 20);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Lens emissive map: a faint fill (the lens glows as a whole while it
    reads) and an etched check (what stays lit once it has finished). */
export function lensTexture() {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const g = c.getContext("2d")!;
  g.fillStyle = "rgb(70,70,70)";
  g.fillRect(0, 0, S, S);
  g.strokeStyle = "#ffffff";
  g.lineWidth = 22;
  g.lineCap = "round";
  g.lineJoin = "round";
  g.beginPath();
  g.moveTo(78, 132);
  g.lineTo(112, 166);
  g.lineTo(180, 94);
  g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** The finding as the payoff: a brand-blue card, one bold white line, two
    quieter lines, and the seal's ring as its mark. */
export function findingBlueTexture(aniso: number, L: number, W: number) {
  const PX = 1024;
  const S = PX / L;
  const c = document.createElement("canvas");
  c.width = PX;
  c.height = Math.round(W * S);
  const g = c.getContext("2d")!;
  g.setTransform(S, 0, 0, S, 0, 0);
  g.fillStyle = "#234d9e";
  g.fillRect(0, 0, L, W);
  g.strokeStyle = "rgba(255,255,255,0.95)";
  g.lineWidth = 0.012;
  g.beginPath();
  g.arc(0.11, 0.12, 0.045, 0, Math.PI * 2);
  g.stroke();
  g.beginPath();
  g.arc(0.11, 0.12, 0.022, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = "#ffffff";
  g.beginPath();
  g.roundRect(0.07, W * 0.36, L * 0.7, 0.05, 0.025);
  g.fill();
  g.fillStyle = "rgba(255,255,255,0.55)";
  for (const [i, f] of [[0, 0.82], [1, 0.6]] as const) {
    g.beginPath();
    g.roundRect(0.07, W * 0.52 + i * 0.075, (L - 0.14) * f, 0.026, 0.013);
    g.fill();
  }
  g.fillStyle = "#6f92d7";
  g.beginPath();
  g.roundRect(0.07, W * 0.8, 0.14, 0.045, 0.0225);
  g.fill();
  return finish(c, aniso);
}
