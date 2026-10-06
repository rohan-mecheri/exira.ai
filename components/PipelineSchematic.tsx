"use client";

import { useEffect, useRef, useState } from "react";
import { STAGES, type SchemaId } from "@/lib/isolation";

/* Section 02's schematic.

   One drawing, always complete. The four stages do not add or remove
   parts; they change which parts are current. A node is quiet (hairline
   stroke, muted label) or active (brand stroke, tinted ground, ink label),
   and a connector is quiet or carrying. Opacity is not used for either:
   dimming a box to 45% made the idle drawing look washed rather than
   subordinate.

   The sealed environment keeps a brand-blue wall in every stage; in stage
   01, which is about the boundary itself, the wall darkens and thickens
   and the region takes a tint, so every stage changes something. The
   export policy is a port in that wall: the line is cut either side of
   it and the port always carries the navy stroke, so it reads as part of
   the boundary, the only opening, which is the claim the copy makes in
   words. Inbound connectors end at the wall rather than crossing it.

   Motion is one thing, used once: the active connector carries a short
   pulse in the direction of travel. In stage 04 the pulse runs as a single
   path from the engine, under the policy, to Exira, so the one route out
   is traced as one movement. Stage 01 carries nothing, which is the point
   of stage 01. On first entry the boundary draws itself and the nodes
   settle in; that runs once.

   Two layouts, one description. Landscape for the pinned desktop stage,
   portrait below 640px where the strip would otherwise shrink past
   legibility or scroll sideways. Below 900px the section is unpinned and
   the scroll state never changes, so a caption names the stage and a row
   of small dots picks one (the caption carries the meaning; the dots are
   only the control, so they stay quiet). The pick goes to the parent, so
   the drawing, the caption and the text beneath always show the same
   stage: a drawing that stepped itself above text that did not would
   label one stage over another's copy. Reduced motion turns off the
   pulse and the entrance; the drawing is still correct standing still.

   Which parts are active is derived from the stage data rather than
   toggled by hand, so the two cannot drift apart. */

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

/** An axis-aligned connector from its tail (x1,y1) to the arrowhead tip at (x2,y2). */
interface Seg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

interface Layout {
  viewBox: string;
  /** Which wall of the sealed box the export policy sits in. */
  side: "right" | "bottom";
  repo: Rect;
  target: Rect;
  sealed: Rect;
  policy: Rect;
  exira: Rect;
  /** The engine glyph's painted bounds. */
  engine: Rect;
  /** Caption under the glyph: centre x and baseline. */
  caption: { x: number; y: number };
  /** Region label inside the sealed environment: start x and baseline. */
  title: { x: number; y: number };
  clone: Seg;
  auth: Seg;
  out: Seg;
  del: Seg;
  /** The stage-04 pulse: engine to Exira as one path, passing under the policy. */
  report: string;
}

/* Geometry. Nothing below is a hand-placed coordinate: every position is
   derived from this one set of constants, so the drawing stays aligned
   when any of them changes.

   The rules the derivation enforces, in both drawings:
   - every node box is the same size (NODE_W x NODE_H; the portrait
     drawing widens its boxes so a pair spans the sealed box exactly);
   - every connector spans the same clear distance SPAN between the two
     things it joins, and stops ARROW_GAP short of both of them;
   - the export policy is centred on the wall it sits in, and the wall is
     cut NOTCH either side of it;
   - the glyph, the policy and Exira share one axis through the centre of
     the sealed box, and Repository and Target sit symmetrically about it;
   - inside the sealed box, the region label's cap line sits PAD from the
     top and left edges, and (landscape) the caption's baseline sits PAD
     from the bottom edge, so the glyph is on the box's true centre;
   - the drawing has the same MARGIN on every side of its content, so it
     is centred in whatever column holds it.

   Text sits by its cap height so a label is optically centred in its box.
   FONT must match the .sch text size in styles/sections.css. */
const FONT = 14;
const CAP = FONT * 0.72; // Instrument Sans cap height (OS/2 sCapHeight 720/1000)
const DESC = FONT * 0.215; // painted depth of "g", the caption's lowest ink

const NODE_W = 112;
const NODE_H = 56;
const ROW_GAP = 28; // between Repository and Target (landscape)
const COL_GAP = 24; // between Repository and Target (portrait)
const SPAN = 48; // clear distance every connector crosses
const ARROW_GAP = 5; // connector to the box at either end
const HEAD = 7; // arrowhead length
const HALF = 4; // arrowhead half-width
const PAD = 18; // sealed box: edge to region label / caption
const GAP_IN = 18; // sealed box: label to glyph, glyph to caption
const NOTCH = 6; // wall cut either side of the export policy
const R = 5; // corner radius of the sealed box (nodes take R - 1)
const MARGIN = 2; // clearance for strokes on every side

/* The mark's painted bounds inside #ico-src (the sprite's raw paths). */
const MARK_W = 462;
const MARK_H = 422;
/* Connectors leaving the glyph are measured from its painted bounds: the
   layers' side tips all reach x 462, so that is where its ink ends. */
const GLYPH_W = 104;
/* The glyph's ink at its centre line stops short of its box: the layers
   are diamonds, and their tips sit above and below that line. Connectors
   leaving it start this far inside the box, so the visible gap matches
   every other connector's. */
const GLYPH_INSET = 6;
const GLYPH_H = (GLYPH_W * MARK_H) / MARK_W;

const PORTRAIT_W = 336; // the portrait drawing's content width (phone column)

const rect = (cx: number, cy: number, w: number, h: number): Rect => ({
  x: cx - w / 2,
  y: cy - h / 2,
  w,
  h,
});

/** A connector across a clear span, stopped ARROW_GAP short of both ends. */
function across(from: number, to: number, at: number, axis: "x" | "y"): Seg {
  const d = Math.sign(to - from);
  const a = from + d * ARROW_GAP;
  const b = to - d * ARROW_GAP;
  return axis === "x" ? { x1: a, y1: at, x2: b, y2: at } : { x1: at, y1: a, x2: at, y2: b };
}

function viewBox(w: number, h: number) {
  return `${-MARGIN} ${-MARGIN} ${w + 2 * MARGIN} ${h + 2 * MARGIN}`;
}

/* Landscape: inputs, sealed box, policy in its right wall, Exira. */
function wide(): Layout {
  // The sealed box is as tall as its contents: label band, glyph, caption
  // band, mirrored about the glyph's centre.
  const band = PAD + CAP + GAP_IN;
  const sh = 2 * band + GLYPH_H;
  // Wall to glyph on the left mirrors glyph to policy on the right, where
  // the policy's inner half and one span sit.
  const sw = GLYPH_W + 2 * (SPAN + NODE_W / 2);
  const sx = NODE_W + SPAN;
  const cy = sh / 2;
  const cx = sx + sw / 2;
  const wall = sx + sw;
  const policy = rect(wall, cy, NODE_W, NODE_H);
  const exiraX = policy.x + NODE_W + SPAN;
  const width = exiraX + NODE_W;
  const off = (NODE_H + ROW_GAP) / 2;
  const engine = rect(cx, cy, GLYPH_W, GLYPH_H);
  return {
    viewBox: viewBox(width, sh),
    side: "right",
    repo: rect(NODE_W / 2, cy - off, NODE_W, NODE_H),
    target: rect(NODE_W / 2, cy + off, NODE_W, NODE_H),
    sealed: { x: sx, y: 0, w: sw, h: sh },
    policy,
    exira: rect(exiraX + NODE_W / 2, cy, NODE_W, NODE_H),
    engine,
    caption: { x: cx, y: sh - PAD },
    title: { x: sx + PAD, y: PAD + CAP },
    clone: across(NODE_W, sx, cy - off, "x"),
    auth: across(NODE_W, sx, cy + off, "x"),
    out: across(cx + GLYPH_W / 2 - GLYPH_INSET, policy.x, cy, "x"),
    del: across(policy.x + NODE_W, exiraX, cy, "x"),
    report: `M${cx + GLYPH_W / 2 - GLYPH_INSET + ARROW_GAP} ${cy} H${exiraX - ARROW_GAP}`,
  };
}

/* Portrait: inputs side by side above the box, policy in its bottom wall,
   Exira under it. Node boxes widen so the pair spans the box exactly. */
function tall(): Layout {
  const w = PORTRAIT_W;
  const nw = (w - COL_GAP) / 2;
  const cx = w / 2;
  const sy = NODE_H + SPAN;
  const glyphTop = sy + PAD + CAP + GAP_IN;
  const engine = { x: cx - GLYPH_W / 2, y: glyphTop, w: GLYPH_W, h: GLYPH_H };
  const capBase = glyphTop + GLYPH_H + GAP_IN + CAP;
  const capFoot = capBase + DESC; // the caption is the out connector's source
  const policyY = capFoot + SPAN;
  const sb = policyY + NODE_H / 2; // the bottom wall runs through the policy
  const policy = { x: cx - nw / 2, y: policyY, w: nw, h: NODE_H };
  const exiraY = policyY + NODE_H + SPAN;
  const height = exiraY + NODE_H;
  const left = nw / 2;
  const right = w - nw / 2;
  return {
    viewBox: viewBox(w, height),
    side: "bottom",
    repo: rect(left, NODE_H / 2, nw, NODE_H),
    target: rect(right, NODE_H / 2, nw, NODE_H),
    sealed: { x: 0, y: sy, w, h: sb - sy },
    policy,
    exira: { x: cx - nw / 2, y: exiraY, w: nw, h: NODE_H },
    engine,
    caption: { x: cx, y: capBase },
    title: { x: PAD, y: sy + PAD + CAP },
    clone: across(NODE_H, sy, left, "y"),
    auth: across(NODE_H, sy, right, "y"),
    out: across(capFoot, policyY, cx, "y"),
    del: across(policyY + NODE_H, exiraY, cx, "y"),
    report: `M${cx} ${capFoot + ARROW_GAP} V${exiraY - ARROW_GAP}`,
  };
}

const WIDE = wide();
const TALL = tall();

/* The boundary as one open path: it starts at one side of the port's
   notch and runs clockwise round the box to the other side, so the gap
   is real (not the port's fill painted over a line) and the entrance
   still draws it in one stroke. */
function boundary(l: Layout) {
  const { x: L, y: T } = l.sealed;
  const Rt = L + l.sealed.w;
  const B = T + l.sealed.h;
  const p = l.policy;
  const arc = (x: number, y: number) => `A${R} ${R} 0 0 1 ${x} ${y}`;
  if (l.side === "right") {
    return (
      `M${Rt} ${p.y + p.h + NOTCH} V${B - R} ${arc(Rt - R, B)} H${L + R} ${arc(L, B - R)} ` +
      `V${T + R} ${arc(L + R, T)} H${Rt - R} ${arc(Rt, T + R)} V${p.y - NOTCH}`
    );
  }
  return (
    `M${p.x - NOTCH} ${B} H${L + R} ${arc(L, B - R)} V${T + R} ${arc(L + R, T)} ` +
    `H${Rt - R} ${arc(Rt, T + R)} V${B - R} ${arc(Rt - R, B)} H${p.x + p.w + NOTCH}`
  );
}

/** Line stopped short of the tip, and a filled head that ends on it. */
function arrow(s: Seg) {
  const dx = Math.sign(s.x2 - s.x1);
  const dy = Math.sign(s.y2 - s.y1);
  const bx = s.x2 - dx * HEAD;
  const by = s.y2 - dy * HEAD;
  const head = dx
    ? `M${bx} ${by - HALF} L${s.x2} ${s.y2} L${bx} ${by + HALF} Z`
    : `M${bx - HALF} ${by} L${s.x2} ${s.y2} L${bx + HALF} ${by} Z`;
  return {
    line: `M${s.x1} ${s.y1} L${bx + dx} ${by + dy}`,
    full: `M${s.x1} ${s.y1} L${s.x2} ${s.y2}`,
    head,
  };
}

function Flow({
  id,
  seg,
  hot,
  pulse,
}: {
  id: SchemaId;
  seg: Seg;
  hot: boolean;
  pulse: boolean;
}) {
  const a = arrow(seg);
  return (
    <g className={hot ? "fl hot" : "fl"} data-id={id}>
      <path className="ln" d={a.line} />
      <path className="hd" d={a.head} />
      {pulse && <path className="pulse" d={a.full} pathLength={100} />}
    </g>
  );
}

function Node({
  id,
  r,
  label,
  hot,
}: {
  id: SchemaId;
  r: Rect;
  label: string;
  hot: boolean;
}) {
  return (
    <g className={hot ? "nd hot" : "nd"} data-id={id}>
      <rect x={r.x} y={r.y} width={r.w} height={r.h} rx={R - 1} />
      <text x={r.x + r.w / 2} y={r.y + r.h / 2 + CAP / 2} textAnchor="middle">
        {label}
      </text>
    </g>
  );
}

function Drawing({
  l,
  hot,
  variant,
}: {
  l: Layout;
  hot: readonly SchemaId[];
  variant: "wide" | "tall";
}) {
  const on = (id: SchemaId) => hot.includes(id);
  const report = on("f-out") && on("f-del");
  const k = l.engine.w / MARK_W;
  // The engine's caption follows the parts it belongs to: the boundary in
  // stage 01, and the outbound route in stage 04, where it is the source.
  const engineHot = on("n-sealed") || on("f-out");
  return (
    <svg
      className={`sch sch-${variant}`}
      viewBox={l.viewBox}
      role="img"
      aria-label="Schematic: the target's repository provider and the target itself both feed a sealed environment where the analysis engine runs. Findings leave it through an export policy, the only opening in its boundary, and reach Exira. Every path runs one way."
    >
      <g className={on("n-sealed") ? "nd sealed hot" : "nd sealed"} data-id="n-sealed">
        <rect
          className="ground"
          x={l.sealed.x}
          y={l.sealed.y}
          width={l.sealed.w}
          height={l.sealed.h}
          rx={R}
        />
        <path className="wall" d={boundary(l)} pathLength={100} />
        <text className="region" x={l.title.x} y={l.title.y}>
          Sealed environment
        </text>
        <use href="#ico-src" transform={`translate(${l.engine.x} ${l.engine.y}) scale(${k})`} />
        <text className={engineHot ? "engine hot" : "engine"} x={l.caption.x} y={l.caption.y} textAnchor="middle">
          Analysis engine
        </text>
      </g>

      <Flow id="f-clone" seg={l.clone} hot={on("f-clone")} pulse />
      <Flow id="f-auth" seg={l.auth} hot={on("f-auth")} pulse />
      <Flow id="f-out" seg={l.out} hot={on("f-out")} pulse={false} />
      <Flow id="f-del" seg={l.del} hot={on("f-del")} pulse={false} />
      <g className={report ? "fl hot" : "fl"} data-id="f-report">
        <path className="pulse" d={l.report} pathLength={100} />
      </g>

      <Node id="n-repo" r={l.repo} label="Repository" hot={on("n-repo")} />
      <Node id="n-target" r={l.target} label="Target" hot={on("n-target")} />
      <Node id="n-policy" r={l.policy} label="Export policy" hot={on("n-policy")} />
      <Node id="n-exira" r={l.exira} label="Exira" hot={on("n-exira")} />
    </svg>
  );
}

const N = STAGES.length;

export function PipelineSchematic({
  step,
  hot,
  onPick,
}: {
  step: number;
  hot: readonly SchemaId[];
  /** A stage chosen from the caption's dots (unpinned layouts only). */
  onPick: (j: number) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [seen, setSeen] = useState(false);

  // The entrance runs once, the first time the drawing is on screen.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          setSeen(true);
          io.disconnect();
        }
      },
      { threshold: 0.35 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const current = step;
  const lit = hot;

  return (
    <div className="sch-wrap" ref={ref} data-step={current} data-seen={seen ? "1" : "0"}>
      <Drawing l={WIDE} hot={lit} variant="wide" />
      <Drawing l={TALL} hot={lit} variant="tall" />
      {/* Unpinned only (CSS): names the stage the drawing is showing, and
          lets the reader step it by hand, which is the only way to step it
          with reduced motion on. */}
      <div className="sch-cap">
        <span className="sch-cap-t">
          <span className="sch-cap-n">
            {current + 1} of {N}
          </span>
          {STAGES[current].step}
        </span>
        <span className="sch-cap-ctl" role="group" aria-label="Show stage in diagram">
          {STAGES.map((s, j) => (
            <button
              key={s.step}
              type="button"
              aria-label={s.step}
              aria-pressed={j === current}
              onClick={() => onPick(j)}
            >
              <i />
            </button>
          ))}
        </span>
      </div>
    </div>
  );
}
