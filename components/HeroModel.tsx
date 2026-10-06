"use client";

import { useEffect, useRef, useState } from "react";
import { FRAME_POINTER, FRAME_TOUCH, type Framing } from "@/lib/hero/frame";
import type { HeroHandle, PartId } from "@/lib/hero/scene";

/* ══════════════════════════════════════════════════════════
   The hero object, and everything around it that is not WebGL.

   The server renders the poster: the mark itself, from the sprite,
   framed so that it lands exactly where the 3D object's first frame
   will. That is what shows at first paint, under reduced data, and
   wherever WebGL is unavailable. It is inline SVG, so it costs no
   request and is never a Largest Contentful Paint candidate.

   three.js and the scene are fetched only once the hero is near the
   viewport, after the page has gone idle. The canvas fades in over the
   poster; because the two coincide, what the visitor sees is the logo
   becoming an object rather than one picture replacing another.

   Rendering stops whenever the hero is offscreen or the tab is hidden.
   ══════════════════════════════════════════════════════════ */

/** The name of the part being pointed at or tapped: a title, and one
    quieter line under it. Nothing at all otherwise: the object carries
    no caption of its own. */
type Caption = [string, string];

function describe(part: PartId | null): Caption | null {
  if (!part) return null;
  switch (part.kind) {
    case "base":
      return ["Evidence", "Paths, line ranges and hashes. Never the code itself."];
    case "lower":
      return ["Eleven modules", "Each reads one dimension of the codebase."];
    case "upper":
      return ["Checked against each other", "Cross-module findings, the ones that move a price."];
    case "top":
      return ["The assessment", "Reviewed and signed. The only thing that leaves."];
  }
}

function webglAvailable(): boolean {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const STEP = Math.PI / 12; // 15° per arrow press

export function HeroModel() {
  const stageRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HeroHandle | null>(null);
  const [live, setLive] = useState(false);
  const [part, setPart] = useState<PartId | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !webglAvailable()) return;

    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    // Must match the media query in hero.css that picks the poster and
    // the canvas overflow for each framing.
    const coarse = matchMedia("(hover: none), (pointer: coarse)").matches;
    const framing: Framing = coarse ? FRAME_TOUCH : FRAME_POINTER;

    let dead = false;
    let visible = false;
    let started = false;
    let idleId: number | undefined;

    const sync = () => handleRef.current?.setActive(visible && !document.hidden);

    const start = () => {
      if (started) return;
      started = true;
      import("@/lib/hero/scene")
        .then(({ mount }) => {
          if (dead) return;
          handleRef.current = mount(stage, {
            reduce,
            coarse,
            framing,
            onPart: setPart,
            onOpen: () => {},
            onDrag: () => {},
            // The canvas fades in over the poster; the scene then starts
            // its slow turn on its own, which says it can be handled.
            onReady: () => setLive(true),
          });
          // Development only: lets the screenshot harness pose the object
          // at exact angles. Stripped from production builds.
          if (process.env.NODE_ENV !== "production") {
            (window as unknown as { __hero?: HeroHandle }).__hero = handleRef.current;
          }
          sync();
        })
        .catch(() => {
          /* The poster stays. Nothing to recover. */
        });
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !started) {
          // Wait for the browser to be idle so the scene never competes
          // with first paint or hydration.
          const ric = window.requestIdleCallback;
          if (ric) idleId = ric(start, { timeout: 1500 });
          else setTimeout(start, 200);
        }
        sync();
      },
      { rootMargin: "200px 0px" }
    );
    io.observe(stage);
    document.addEventListener("visibilitychange", sync);

    return () => {
      dead = true;
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, []);

  const caption = describe(part);

  function onKey(e: React.KeyboardEvent) {
    const h = handleRef.current;
    if (!h) return;
    const k = e.key;
    if (k === "ArrowLeft") h.nudge(-STEP, 0);
    else if (k === "ArrowRight") h.nudge(STEP, 0);
    else if (k === "ArrowUp") h.nudge(0, -STEP / 2);
    else if (k === "ArrowDown") h.nudge(0, STEP / 2);
    else if (k === "Enter" || k === " ") h.toggleOpen();
    else return;
    e.preventDefault();
  }

  return (
    <figure className="hm">
      <div
        ref={stageRef}
        className={live ? "hm-stage is-live" : "hm-stage"}
        role="img"
        aria-roledescription="interactive model"
        aria-label={
          "The Exira mark as a made object, turning slowly: four plates held apart by " +
          "stand-offs. From the bottom, the evidence plate; a plate machined into eleven " +
          "module lanes; a plate where the modules are checked against each other; and " +
          "the blue assessment, the only thing that leaves. Opened, it traces one finding " +
          "down to the evidence it rests on. Turn it with the arrow keys and open it with Enter."
        }
        tabIndex={live ? 0 : -1}
        onKeyDown={onKey}
        // Keyboard focus opens the stack, as hover does. A click focuses
        // the stage too, but must not hold it open after the pointer leaves.
        onFocus={(e) => handleRef.current?.setFocusOpen(e.currentTarget.matches(":focus-visible"))}
        onBlur={() => handleRef.current?.setFocusOpen(false)}
      >
        {/* The poster is the object's own rest frame, rendered from this
            scene (closed for pointer devices, open for touch), so the
            WebGL canvas fades in over an identical picture. It is also
            the whole graphic wherever WebGL is unavailable. To regenerate
            after changing the scene: in development, pose window.__hero at
            (REST_YAW, REST_ELEV, open 0 or 1), stop it, and save
            canvas.toDataURL() at DPR 2 (pointer at 1440 wide; touch at
            460 wide), then encode as WebP. */}
        <picture className="hm-poster">
          <source
            media="(hover: none), (pointer: coarse)"
            srcSet="/hero/poster-touch.webp"
            width={835}
            height={835}
          />
          <img
            src="/hero/poster-pointer.webp"
            width={960}
            height={1094}
            alt=""
            decoding="async"
            fetchPriority="high"
          />
        </picture>
      </div>
      {/* Names the part pointed at or tapped; takes no room in the layout. */}
      <figcaption className={caption ? "hm-cap is-on" : "hm-cap"} aria-live="polite">
        <span className="hm-cap-t">{caption?.[0]}</span>
        <span className="hm-cap-d">{caption?.[1]}</span>
      </figcaption>
    </figure>
  );
}

