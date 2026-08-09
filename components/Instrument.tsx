"use client";

import { useEffect, useRef } from "react";
import { MODULES } from "@/lib/modules";

/* ══════════════════════════════════════════════════════════
   Mini instrument — the mark, exploded.
   Evidence plane → eleven module planes → assessment plane.

   The geometry is the real logo silhouette (A = 0.0278, B = 0.9722,
   half-width to half-height 231:100). Changing those constants stops it
   being the logo.

   Direct canvas work, so it lives in an effect behind a ref. The drawing
   is unchanged from the vanilla version; what is new is that every
   listener, timer, observer and animation frame is torn down on unmount —
   under client-side navigation a leaked rAF loop would keep painting to a
   detached canvas.
   ══════════════════════════════════════════════════════════ */

const N = 13;
const STEP = 760;
const HOLD = 2200;
const A = 0.0278;
const B = 0.9722;

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
type PlaneState = "pending" | "on" | "done";

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
    let raf: number | null = null;
    let t0 = performance.now();
    let last = -1;
    let small = false;
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
      small = W < 380;
      const rw = Math.min(W * 0.3, 104);
      const rh = rw * 0.4329;
      const gap = Math.min((H - 58) / (N - 1), rh * 0.62);
      const cx = W * 0.5 + 8;
      const top = H / 2 - (gap * (N - 1)) / 2;
      P = [];
      for (let i = 0; i < N; i++) P.push({ x: cx, y: top + gap * (N - 1 - i), rw, rh });
      dust = [];
      for (let i = 0; i < 18; i++) dust.push(seed(true));
    }

    /* architectural dimension line, left of the stack */
    function dimension() {
      const t = P[11];
      const b = P[1];
      const x = Math.max(9, b.x - b.rw - 22);
      ctx.save();
      ctx.strokeStyle = "rgba(93,112,146,.4)";
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, t.y);
      ctx.lineTo(x, b.y);
      ctx.stroke();
      (
        [
          [x, t.y],
          [x, b.y],
        ] as const
      ).forEach(([px, py]) => {
        ctx.beginPath();
        ctx.moveTo(px - 3.5, py);
        ctx.lineTo(px + 3.5, py);
        ctx.stroke();
      });
      ctx.translate(x - 7, (t.y + b.y) / 2);
      ctx.rotate(-Math.PI / 2);
      ctx.font = `500 8px ${mono}`;
      ctx.fillStyle = "#8D9BB4";
      ctx.textAlign = "center";
      ctx.textBaseline = "bottom";
      ctx.fillText("11 MODULES", 0, 0);
      ctx.restore();
    }

    /* Per-plane module labels. Written, drawn once, and left switched off —
       frame() does not call it. Kept because it is the only place the
       MODULES short codes get rendered onto the instrument, and turning it
       back on is a one-line change inside frame(). */
    function callout(i: number, sub: number) {
      if (small || i < 1 || i > 11) return;
      const L = P[i];
      const sx = L.x + L.rw + 5;
      const sy = L.y;
      const tx = Math.min(W - 10, L.x + L.rw + 52);
      ctx.save();
      ctx.globalAlpha = Math.min(1, sub * 4);
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
      ctx.font = `500 8.5px ${mono}`;
      ctx.fillStyle = "#06307C";
      ctx.textBaseline = "bottom";
      ctx.fillText(MODULES[i - 1].short, tx + 5, sy - 3);
      ctx.font = `400 8px ${mono}`;
      ctx.fillStyle = "#8D9BB4";
      ctx.textBaseline = "top";
      ctx.fillText(MODULES[i - 1].id, tx + 5, sy + 2);
      ctx.restore();
    }

    function plane(i: number, state: PlaneState, sub: number) {
      const L = P[i];
      if (i === 0) {
        mark(ctx, L.x, L.y, L.rw, L.rh);
        ctx.fillStyle = "#F9FBFF";
        ctx.fill();
        ctx.save();
        ctx.clip();
        ctx.fillStyle = "rgba(78,142,255,.5)";
        for (let gx = L.x - L.rw; gx < L.x + L.rw; gx += 8)
          for (let gy = L.y - L.rh; gy < L.y + L.rh; gy += 7) {
            ctx.beginPath();
            ctx.arc(gx, gy, 0.75, 0, 6.283);
            ctx.fill();
          }
        ctx.restore();
        ctx.lineWidth = 1;
        ctx.strokeStyle = "rgba(202,219,255,.9)";
        ctx.stroke();
      } else if (i === N - 1) {
        mark(ctx, L.x, L.y, L.rw, L.rh);
        if (state !== "pending") {
          const g = ctx.createLinearGradient(L.x - L.rw, L.y, L.x + L.rw, L.y);
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
          ctx.fillStyle = "rgba(35,77,158,.035)";
          ctx.fill();
          ctx.lineWidth = 1;
          ctx.strokeStyle = "rgba(35,77,158,.16)";
          ctx.setLineDash([4, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        }
      } else {
        const d = i / (N - 2);
        mark(ctx, L.x, L.y, L.rw, L.rh);
        ctx.fillStyle =
          state === "done" ? `rgba(214,220,233,${0.74 + 0.13 * d})` : "rgba(233,237,246,.46)";
        ctx.fill();
        ctx.lineWidth = state === "done" ? 1.3 : 1;
        ctx.strokeStyle = state === "done" ? "rgba(255,255,255,.95)" : "rgba(35,77,158,.13)";
        ctx.stroke();
        if (state === "on") {
          const e = 1 - Math.pow(1 - sub, 3);
          mark(ctx, L.x, L.y, L.rw, L.rh);
          ctx.fillStyle = `rgba(66,110,183,${0.3 * (1 - sub * 0.5)})`;
          ctx.fill();
          ctx.lineWidth = 1.4;
          ctx.strokeStyle = "rgba(6,48,124,.78)";
          ctx.stroke();
          mark(ctx, L.x, L.y, L.rw * (1 + e * 0.2), L.rh * (1 + e * 0.2));
          ctx.lineWidth = 1;
          ctx.strokeStyle = `rgba(66,110,183,${0.42 * (1 - e)})`;
          ctx.stroke();
        }
      }
    }

    function frame() {
      if (dead) return;
      if (!P.length) {
        raf = requestAnimationFrame(frame);
        return;
      }
      const el = performance.now() - t0;
      const cyc = N * STEP + HOLD;
      const p = el % cyc;
      let idx = Math.floor(p / STEP);
      const run = idx < N;
      if (!run) idx = N - 1;
      const sub = run ? (p % STEP) / STEP : 1;
      if (last > idx) last = -1;
      if (run && idx !== last) {
        last = idx;
        if (cap) cap.textContent = String(Math.max(0, Math.min(11, idx))).padStart(2, "0");
      }
      if (!run && cap) cap.textContent = "11";

      ctx.clearRect(0, 0, W, H);
      ctx.fillStyle = "rgba(35,77,158,.32)";
      for (const q of dust) {
        q.y -= q.v;
        q.a = Math.min(1, q.a + 0.02);
        const b = P[0];
        if (q.y < b.y - 3) {
          Object.assign(q, seed(false));
          continue;
        }
        ctx.globalAlpha = 0.48 * q.a * Math.min(1, (q.y - (b.y - 3)) / 40);
        ctx.beginPath();
        ctx.arc(q.x, q.y, q.r, 0, 6.283);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      dimension();
      for (let i = 0; i < N; i++)
        plane(i, i < idx ? "done" : run && i === idx ? "on" : "pending", sub);

      raf = requestAnimationFrame(frame);
    }

    function still() {
      measure();
      if (!P.length) return;
      ctx.clearRect(0, 0, W, H);
      dimension();
      for (let i = 0; i < N; i++) plane(i, "done", 1);
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
      last = -1;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(frame);
    }

    const onResize = () => {
      clearTimeout(rz);
      rz = setTimeout(boot, 200);
    };
    addEventListener("resize", onResize);

    // Only paint while the panel is on screen.
    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window && !reduce) {
      io = new IntersectionObserver(
        (es) =>
          es.forEach((e) => {
            if (e.isIntersecting) {
              if (!raf && !dead) raf = requestAnimationFrame(frame);
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
    <>
      <div
        className="panel"
        role="img"
        aria-label="A stack of thirteen layers: an evidence base, eleven analysis modules, and a resolved assessment at the top. A pass rises through them in sequence."
      >
        <canvas ref={cvRef} />
      </div>
      <div className="panel-cap">
        <span>Evidence → assessment</span>
        <span>
          <b ref={capRef}>00</b> / 11
        </span>
      </div>
    </>
  );
}
