"use client";

import { useEffect, useRef } from "react";
import { MODULES } from "@/lib/modules";

/* ══════════════════════════════════════════════════════════
   Mini instrument — the mark, exploded.
   Evidence plane → eleven module planes → assessment plane.

   The geometry is the real logo silhouette (A = 0.0278, B = 0.9722,
   half-width to half-height 231:100). Changing those constants stops it
   being the logo.

   THE CYCLE, and why it is shaped this way.

   The first version drew all thirteen planes from the first frame as pale
   ghosts and simply recoloured them as the pass climbed. That had two
   problems: nothing was ever created, so the pass read as a highlight
   sliding over static furniture; and the loop ended with every plane
   snapping from resolved back to ghost in a single frame.

   So: planes are not drawn until they exist. Each one rises into its slot
   and stays. When the stack is complete it holds, then the twelve lower
   planes converge upward into the assessment plane and fade — the eleven
   modules reconciling into one output, which is the actual product claim.
   The assessment plane then dissolves on its own.

   The loop closes because both ends are empty. DISSOLVE finishes at alpha
   zero and BUILD opens at alpha zero, so the seam has nothing to show. No
   frame ever contains a discontinuity.

   Direct canvas work, so it lives in an effect behind a ref. Every
   listener, timer, observer and animation frame is torn down on unmount:
   under client-side navigation a leaked rAF loop would keep painting to a
   detached canvas.
   ══════════════════════════════════════════════════════════ */

const N = 13;
const A = 0.0278;
const B = 0.9722;

/* Phase durations, ms. SPAWN is deliberately longer than STEP so two
   planes are in motion at once and the build reads as continuous rather
   than as thirteen separate events. */
const STEP = 440;
const SPAWN = 620;
const BUILD = (N - 1) * STEP + SPAWN;
const HOLD = 2000;
const RESOLVE = 1150;
const DISSOLVE = 760;
const CYCLE = BUILD + HOLD + RESOLVE + DISSOLVE;

/** Stagger between planes during the upward convergence. */
const CONVERGE_STAGGER = 26;

/* What each plane is, bottom to top: the evidence base, the eleven
   modules, the resolved assessment. The pass labels the plane it is
   currently on, so the stack reads as a sequence rather than a texture. */
const LABELS: readonly { name: string; sub?: string }[] = [
  { name: "EVIDENCE" },
  ...MODULES.map((m) => ({ name: m.short, sub: m.id })),
  { name: "ASSESSMENT" },
];

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v);
const easeOut = (u: number) => 1 - Math.pow(1 - u, 3);
const easeIn = (u: number) => u * u * u;
const easeInOut = (u: number) => (u < 0.5 ? 4 * u * u * u : 1 - Math.pow(-2 * u + 2, 3) / 2);

interface Plane {
  x: number;
  y: number;
  rw: number;
  rh: number;
}
interface Mote {
  x: number;
  y: number;
  v: number;
  r: number;
  a: number;
}

export function Instrument() {
  const cvRef = useRef<HTMLCanvasElement>(null);
  const capRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const canvas = cvRef.current;
    if (!canvas) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    // Rebound as non-nullable: the guards above narrow `canvas`/`context`,
    // but that narrowing does not reach the function declarations below.
    const cv: HTMLCanvasElement = canvas;
    const ctx: CanvasRenderingContext2D = context;
    const cap = capRef.current;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

    // A canvas needs a concrete family string, so resolve the token the
    // rest of the site draws its evidence type from.
    const mono =
      getComputedStyle(document.documentElement).getPropertyValue("--mono").trim() ||
      '"IBM Plex Mono", monospace';

    let W = 0;
    let H = 0;
    let P: Plane[] = [];
    let dust: Mote[] = [];
    let rise = 0;
    let raf: number | null = null;
    let t0 = performance.now();
    let lastCap = -1;
    let labelled = false;
    let rz: ReturnType<typeof setTimeout> | undefined;
    let dead = false;

    function mark(g: CanvasRenderingContext2D, x: number, y: number, rw: number, rh: number) {
      g.beginPath();
      g.moveTo(x + A * rw, y - B * rh);
      g.lineTo(x + B * rw, y - A * rh);
      g.quadraticCurveTo(x + rw, y, x + B * rw, y + A * rh);
      g.lineTo(x + A * rw, y + B * rh);
      g.quadraticCurveTo(x, y + rh, x - A * rw, y + B * rh);
      g.lineTo(x - B * rw, y + A * rh);
      g.quadraticCurveTo(x - rw, y, x - B * rw, y - A * rh);
      g.lineTo(x - A * rw, y - B * rh);
      g.quadraticCurveTo(x, y - rh, x + A * rw, y - B * rh);
      g.closePath();
    }

    function seed(init: boolean): Mote {
      const b = P[0] || { x: W / 2, y: H * 0.8, rw: 100, rh: 44 };
      return {
        x: b.x + (Math.random() - 0.5) * b.rw * 2.5,
        y: init ? b.y + Math.random() * H * 0.3 : b.y + b.rh + 12 + Math.random() * 50,
        v: 0.12 + Math.random() * 0.26,
        r: 0.55 + Math.random() * 0.95,
        a: 0,
      };
    }

    function measure() {
      const r = cv.getBoundingClientRect();
      if (!r.width) return;
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = r.width;
      H = r.height;
      cv.width = (W * dpr) | 0;
      cv.height = (H * dpr) | 0;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      // --instr-gutter is owned by hero.css, which zeroes it at the
      // breakpoint where the labels no longer fit. Read every measure, so
      // a resize across that breakpoint is picked up.
      const gutter = parseFloat(getComputedStyle(cv).getPropertyValue("--instr-gutter")) || 0;
      labelled = gutter > 0;
      const rw = Math.min((W - gutter) * 0.3, 104);
      const rh = rw * 0.4329;

      // Each plane extends rh above and below its own centre. The stack
      // has to clear that at both ends, or the top plane gets cut off.
      const gap = Math.min((H - 2 * rh - 18) / (N - 1), rh * 0.62);
      const cx = (W - gutter) / 2;
      const top = H / 2 - (gap * (N - 1)) / 2;
      P = [];
      for (let i = 0; i < N; i++) P.push({ x: cx, y: top + gap * (N - 1 - i), rw, rh });
      rise = gap * 2;
      dust = [];
      for (let i = 0; i < 18; i++) dust.push(seed(true));
    }

    /* Architectural dimension line, left of the stack. It grows with the
       build rather than being there from the start, so it reads as a
       measurement accruing. `topY` is interpolated, not snapped to a
       plane, or the line would tick upward in twelve visible steps. */
    function dimension(topY: number, a: number, textA: number) {
      if (a <= 0.002) return;
      const b = P[1];
      const x = Math.max(9, b.x - b.rw - 22);
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = "rgba(93,112,146,.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, topY);
      ctx.lineTo(x, b.y);
      ctx.stroke();
      (
        [
          [x, topY],
          [x, b.y],
        ] as const
      ).forEach(([px, py]) => {
        ctx.beginPath();
        ctx.moveTo(px - 3.5, py);
        ctx.lineTo(px + 3.5, py);
        ctx.stroke();
      });
      if (textA > 0.002) {
        ctx.globalAlpha = a * textA;
        ctx.translate(x - 7, (topY + b.y) / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.font = `500 8px ${mono}`;
        ctx.fillStyle = "#8D9BB4";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.fillText("11 MODULES", 0, 0);
      }
      ctx.restore();
    }

    /* Leader line and label for the plane the pass is on. Starts outside
       the expanding ring so the two never collide. Suppressed wherever the
       gutter is zero. */
    function callout(i: number, a: number, dy: number) {
      if (!labelled || a <= 0.002 || i < 0 || i >= N) return;
      const label = LABELS[i];
      const L = P[i];
      const sy = L.y + dy;
      const sx = L.x + L.rw * 1.2 + 6;
      const tx = L.x + L.rw * 1.2 + 20;
      ctx.save();
      ctx.globalAlpha = a;
      ctx.strokeStyle = "rgba(35,77,158,.5)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(tx, sy);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(sx, sy, 2, 0, 6.283);
      ctx.fillStyle = "#06307C";
      ctx.fill();
      ctx.textAlign = "left";
      ctx.letterSpacing = "0.07em";
      ctx.font = `500 8.5px ${mono}`;
      ctx.fillStyle = "#06307C";
      ctx.textBaseline = label.sub ? "bottom" : "middle";
      ctx.fillText(label.name, tx + 5, label.sub ? sy - 2 : sy);
      if (label.sub) {
        ctx.font = `400 8px ${mono}`;
        ctx.fillStyle = "#8D9BB4";
        ctx.textBaseline = "top";
        ctx.fillText(label.sub, tx + 5, sy + 3);
      }
      ctx.restore();
    }

    /* One plane, fully parameterised. `heat` is how recently it arrived:
       1 at the instant it lands, decaying to 0 as it settles. It drives
       the blue wash and the ring that expands off the edge. */
    function drawPlane(i: number, a: number, dy: number, s: number, heat: number) {
      if (a <= 0.002) return;
      const L = P[i];
      const x = L.x;
      const y = L.y + dy;
      const rw = L.rw * s;
      const rh = L.rh * s;

      ctx.save();
      ctx.globalAlpha = a;

      if (i === 0) {
        mark(ctx, x, y, rw, rh);
        ctx.fillStyle = "#F9FBFF";
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.fillStyle = "rgba(78,142,255,.5)";
        for (let gx = x - rw; gx < x + rw; gx += 8)
          for (let gy = y - rh; gy < y + rh; gy += 7) {
            ctx.beginPath();
            ctx.arc(gx, gy, 0.75, 0, 6.283);
            ctx.fill();
          }
        ctx.restore();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(202,219,255,.9)";
        ctx.stroke();
      } else if (i === N - 1) {
        mark(ctx, x, y, rw, rh);
        const g = ctx.createLinearGradient(x - rw, y, x + rw, y);
        g.addColorStop(0, "#06307C");
        g.addColorStop(0.3, "#0B3785");
        g.addColorStop(0.55, "#234D9E");
        g.addColorStop(0.78, "#426EB7");
        g.addColorStop(1, "#6F92D7");
        ctx.fillStyle = g;
        ctx.fill();
        ctx.lineWidth = 1.25;
        ctx.strokeStyle = "rgba(23,78,158,.8)";
        ctx.stroke();
      } else {
        const d = i / (N - 2);
        mark(ctx, x, y, rw, rh);
        ctx.fillStyle = `rgba(214,220,233,${0.74 + 0.13 * d})`;
        ctx.fill();
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = "rgba(255,255,255,.95)";
        ctx.stroke();
      }

      if (heat > 0.002 && i !== N - 1) {
        mark(ctx, x, y, rw, rh);
        ctx.fillStyle = `rgba(66,110,183,${0.3 * heat})`;
        ctx.fill();
        ctx.lineWidth = 1.4;
        ctx.strokeStyle = `rgba(6,48,124,${0.78 * heat})`;
        ctx.stroke();
      }
      if (heat > 0.002) {
        const e = 1 - heat;
        mark(ctx, x, y, rw * (1 + e * 0.22), rh * (1 + e * 0.22));
        ctx.lineWidth = 1;
        ctx.strokeStyle = `rgba(66,110,183,${0.42 * heat})`;
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawDust(a: number) {
      if (a <= 0.002) return;
      ctx.fillStyle = "rgba(35,77,158,.32)";
      for (const q of dust) {
        q.y -= q.v;
        q.a = Math.min(1, q.a + 0.02);
        const b = P[0];
        if (q.y < b.y - 3) {
          Object.assign(q, seed(false));
          continue;
        }
        ctx.globalAlpha = a * 0.48 * q.a * Math.min(1, (q.y - (b.y - 3)) / 40);
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    function frame() {
      if (dead) return;
      if (!P.length) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const t = (performance.now() - t0) % CYCLE;
      const tRes = t - BUILD - HOLD;
      const tDis = tRes - RESOLVE;

      // Counter: 00 at the evidence plane, 01–11 as each module lands,
      // then held at 11 for the rest of the cycle.
      const spawned = Math.min(N - 1, Math.floor(t / STEP));
      const capNum = t < BUILD ? Math.max(0, Math.min(11, spawned)) : 11;
      if (cap && capNum !== lastCap) {
        lastCap = capNum;
        cap.textContent = String(capNum).padStart(2, "0");
      }

      ctx.clearRect(0, 0, W, H);
      drawDust(tRes > 0 ? clamp01(1 - tRes / (RESOLVE * 0.7)) : 1);

      // Dimension line grows to the highest module plane placed so far.
      if (t < BUILD + HOLD) {
        const kf = Math.min(11, t / STEP);
        const k0 = Math.floor(kf);
        const k1 = Math.min(11, k0 + 1);
        const topY = P[k0].y + (P[k1].y - P[k0].y) * (kf - k0);
        dimension(topY, clamp01((t - 2 * STEP) / 320), clamp01((t - 11 * STEP) / 320));
      } else if (tRes > 0) {
        dimension(P[11].y, clamp01(1 - tRes / (RESOLVE * 0.5)), 1);
      }

      let labelIdx = -1;
      let labelA = 0;
      let labelDy = 0;

      // Where the stack resolves to. The assessment plane drifts down to
      // the middle of the frame as it absorbs the others, so what is left
      // at the end is centred rather than stranded against the top edge.
      const anchorDy =
        tRes > 0 ? (H / 2 - P[N - 1].y) * easeInOut(clamp01(tRes / RESOLVE)) : 0;
      const anchorY = P[N - 1].y + anchorDy;

      for (let i = 0; i < N; i++) {
        const u = clamp01((t - i * STEP) / SPAWN);
        if (u <= 0) continue;

        const e = easeOut(u);
        let a = e;
        let dy = (1 - e) * rise;
        let s = 0.88 + 0.12 * e;
        let heat = 1 - u;

        if (tRes > 0) {
          if (i < N - 1) {
            // Converge upward into the assessment plane and fade.
            const span = RESOLVE - (N - 2) * CONVERGE_STAGGER;
            const v = clamp01((tRes - i * CONVERGE_STAGGER) / span);
            dy += (anchorY - P[i].y) * easeInOut(v);
            a *= 1 - v * v;
            heat = 0;
          } else {
            // The output acknowledges what it absorbed.
            dy += anchorDy;
            heat = Math.max(heat, 0.4 * Math.sin(Math.PI * clamp01(tRes / RESOLVE)));
          }
        }
        if (tDis > 0) {
          const v = clamp01(tDis / DISSOLVE);
          a *= 1 - easeIn(v);
          s *= 1 + 0.14 * v;
        }

        drawPlane(i, a, dy, s, heat);

        if (i === spawned) {
          labelIdx = i;
          labelDy = dy;
        }
      }

      // Label rides with its plane, then hands over to the next. The
      // assessment label is the punchline, so it stays through the hold.
      if (t < BUILD + HOLD) {
        const local = t - spawned * STEP;
        const inFade = clamp01(local / 150);
        const outFade = spawned === N - 1 ? 1 : clamp01((STEP - local) / 150);
        labelA = Math.min(inFade, outFade);
      } else if (tRes > 0) {
        labelIdx = N - 1;
        labelDy = anchorDy;
        labelA = clamp01(1 - tRes / (RESOLVE * 0.55));
      }
      callout(labelIdx, labelA, labelDy);

      raf = requestAnimationFrame(frame);
    }

    /* Reduced motion: the finished state, drawn once. */
    function still() {
      measure();
      if (!P.length) return;
      ctx.clearRect(0, 0, W, H);
      dimension(P[11].y, 1, 1);
      for (let i = 0; i < N; i++) drawPlane(i, 1, 0, 1, 0);
      if (cap) cap.textContent = "11";
    }

    function boot() {
      if (dead) return;
      if (reduce) {
        still();
        return;
      }
      measure();
      if (!P.length) {
        rz = setTimeout(boot, 120);
        return;
      }
      t0 = performance.now();
      lastCap = -1;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }

    const onResize = () => {
      clearTimeout(rz);
      rz = setTimeout(boot, 200);
    };
    addEventListener("resize", onResize);

    // Only paint while the panel is on screen, and restart the cycle when
    // it comes back: whoever scrolls to the hero sees the build from the
    // beginning rather than joining halfway through.
    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window && !reduce) {
      io = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (e.isIntersecting) {
              if (!raf && !dead) boot();
            } else if (raf) {
              cancelAnimationFrame(raf);
              raf = null;
            }
          }),
        { threshold: 0 }
      );
      io.observe(cv);
    }

    if (document.fonts) document.fonts.ready.then(boot);
    else boot();

    return () => {
      dead = true;
      clearTimeout(rz);
      removeEventListener("resize", onResize);
      io?.disconnect();
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div className="instr">
      <div
        className="panel"
        role="img"
        aria-label="A stack of thirteen layers building in sequence: an evidence base, eleven analysis modules, and a resolved assessment at the top. Each layer is named as it lands, and the completed stack resolves into the assessment."
      >
        <canvas ref={cvRef} />
      </div>
      <div className="panel-cap">
        <span>
          <b ref={capRef}>00</b> / 11
        </span>
      </div>
    </div>
  );
}
