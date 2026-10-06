"use client";

import { useEffect, useRef, useState } from "react";
import { FRAME, posterViewBox } from "@/lib/lab/b/frame";
import type { HeroHandle, PartId } from "@/lib/lab/b/scene";
import css from "./heroB.module.css";

type Caption = [string, string];

function describe(part: PartId | null, coarse: boolean, live: boolean): Caption {
  if (!part)
    return [
      "Code in. Findings out.",
      !live ? "Eleven modules, checked against each other." : coarse ? "Drag to turn it. Tap to open it." : "Drag to turn it. Hover to open it.",
    ];
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

const STEP = Math.PI / 12;

export function HeroB() {
  const stageRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HeroHandle | null>(null);
  const [live, setLive] = useState(false);
  const [part, setPart] = useState<PartId | null>(null);
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !webglAvailable()) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarse = matchMedia("(hover: none), (pointer: coarse)").matches;
    setCoarse(isCoarse);

    let dead = false;
    let visible = false;
    let started = false;
    let introTimer: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;
    const sync = () => handleRef.current?.setActive(visible && !document.hidden);

    const start = () => {
      if (started) return;
      started = true;
      import("@/lib/lab/b/scene")
        .then(({ mount }) => {
          if (dead) return;
          handleRef.current = mount(stage, {
            reduce,
            coarse: isCoarse,
            framing: FRAME,
            onPart: setPart,
            onReady: () => {
              setLive(true);
              introTimer = setTimeout(() => handleRef.current?.intro(1500), 1300);
            },
          });
          if (process.env.NODE_ENV !== "production") {
            (window as unknown as { __heroB?: HeroHandle }).__heroB = handleRef.current;
          }
          sync();
        })
        .catch(() => {});
    };

    const io = new IntersectionObserver(
      ([e]) => {
        visible = e.isIntersecting;
        if (visible && !started) {
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
      clearTimeout(introTimer);
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      handleRef.current?.dispose();
      handleRef.current = null;
    };
  }, []);

  const caption = describe(part, coarse, live);

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
        className={live ? `${css.stage} is-live` : css.stage}
        role="img"
        aria-roledescription="interactive model"
        aria-label={
          "The Exira mark as a physical object: four thin layers. From the bottom, a " +
          "dotted evidence layer; a layer of eleven modules; a layer where the modules " +
          "are checked against each other; and the blue assessment, the only thing " +
          "that leaves. Turn it with the arrow keys and open it with Enter."
        }
        tabIndex={live ? 0 : -1}
        onKeyDown={onKey}
        // Keyboard focus opens it; a mouse click that focuses it does not.
        onFocus={(e) => e.currentTarget.matches(":focus-visible") && handleRef.current?.setFocusOpen(true)}
        onBlur={() => handleRef.current?.setFocusOpen(false)}
      >
        {/* The poster is the mark itself, framed to land exactly where the
            first WebGL frame does. */}
        <svg className={css.poster} viewBox={posterViewBox()} aria-hidden="true">
          <use href="#ico-src" />
        </svg>
      </div>
      <figcaption className="hm-cap">
        <span className="hm-cap-t">{caption[0]}</span>
        <span className="hm-cap-d">{caption[1]}</span>
      </figcaption>
    </figure>
  );
}
