"use client";

import { useEffect, useRef, useState } from "react";
import { FRAME_POINTER, FRAME_TOUCH, posterBox, type Framing } from "@/lib/lab/c/frame";
import type { HeroHandle, PartId } from "@/lib/lab/c/scene";
import s from "./heroc.module.css";

/* Designer C's hero object (lab). The poster is the mark itself, placed
   exactly where the scene's first frame draws it, so the canvas fades in
   over an identical picture. three.js loads only near the viewport, once
   the page is idle; rendering stops whenever nothing moves, the hero is
   offscreen or the tab is hidden. */

type Caption = [string, string];

function describe(part: PartId | null, open: boolean, coarse: boolean, live: boolean): Caption {
  if (part) {
    switch (part.kind) {
      case "top":
        return ["Findings", "The only thing that leaves. Each one is signed."];
      case "upper":
        return ["Cross-checks", "Where one module confirms another's finding."];
      case "lower":
        return ["Eleven modules", "Each reads one dimension of the codebase."];
      case "base":
        return ["Evidence", "Paths, line ranges and hashes. Never the code itself."];
    }
  }
  if (open) return ["Every finding traces back", "Through the modules that agree, to the evidence it rests on."];
  return [
    "Code in. Findings out.",
    !live ? "Eleven modules, checked against each other." : coarse ? "Tap to open it. Drag sideways to turn it." : "Hover to open it. Drag to turn it.",
  ];
}

function webglAvailable() {
  try {
    const c = document.createElement("canvas");
    return !!(c.getContext("webgl2") || c.getContext("webgl"));
  } catch {
    return false;
  }
}

const STEP = Math.PI / 12;

export function HeroC() {
  const stageRef = useRef<HTMLDivElement>(null);
  const handleRef = useRef<HeroHandle | null>(null);
  const [live, setLive] = useState(false);
  const [part, setPart] = useState<PartId | null>(null);
  const [open, setOpen] = useState(false);
  const [coarse, setCoarse] = useState(false);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage || !webglAvailable()) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const isCoarse = matchMedia("(hover: none), (pointer: coarse)").matches;
    setCoarse(isCoarse);
    const framing: Framing = isCoarse ? FRAME_TOUCH : FRAME_POINTER;

    let dead = false;
    let visible = false;
    let started = false;
    let introTimer: ReturnType<typeof setTimeout> | undefined;
    let idleId: number | undefined;
    const sync = () => handleRef.current?.setActive(visible && !document.hidden);

    const start = () => {
      if (started) return;
      started = true;
      import("@/lib/lab/c/scene")
        .then(({ mount }) => {
          if (dead) return;
          handleRef.current = mount(stage, {
            reduce,
            coarse: isCoarse,
            framing,
            onPart: setPart,
            onOpen: setOpen,
            onReady: () => {
              setLive(true);
              // Once per session, after the fade-in: a quiet breath (the
              // plates part a little and close) that says "this opens".
              // No trace, no caption change: the headline lands first.
              let seen = false;
              try {
                seen = sessionStorage.getItem("heroC.breath") === "1";
                sessionStorage.setItem("heroC.breath", "1");
              } catch {}
              if (!seen) introTimer = setTimeout(() => handleRef.current?.intro(1000), 1200);
            },
          });
          if (process.env.NODE_ENV !== "production") {
            (window as unknown as { __heroC?: HeroHandle; __heroCIntro?: () => void }).__heroC = handleRef.current;
            (window as unknown as { __heroCNoIntro?: () => void }).__heroCNoIntro = () => clearTimeout(introTimer);
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

  const cap = describe(part, open, coarse, live);
  const pp = posterBox(FRAME_POINTER);
  const pt = posterBox(FRAME_TOUCH);

  return (
    <figure className={s.hm}>
      <div
        ref={stageRef}
        className={live ? `${s.stage} ${s.live}` : s.stage}
        role="img"
        aria-roledescription="interactive model"
        aria-label={
          "The Exira mark as an object of four thin layers. Opened, it shows how a finding is traced: " +
          "from the blue assessment layer, down through a layer where modules check each other and a " +
          "layer of eleven modules, to the dotted evidence it rests on. Turn it with the arrow keys and " +
          "open it with Enter."
        }
        tabIndex={live ? 0 : -1}
        onKeyDown={onKey}
        style={
          {
            "--pl": pp.left,
            "--pt": pp.top,
            "--pw": pp.width,
            "--tl": pt.left,
            "--tt": pt.top,
            "--tw": pt.width,
            "--ovp": FRAME_POINTER.overflow,
            "--ovt": FRAME_TOUCH.overflow,
          } as React.CSSProperties
        }
      >
        {/* The mark itself: the first paint, and the whole graphic where
            WebGL is unavailable. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img className={s.poster} src="/brand/exira-icon-transparent.svg" alt="" decoding="async" />
      </div>
      <figcaption className={s.cap} aria-live="polite">
        <span className={s.capT}>{cap[0]}</span>
        <span className={s.capD}>{cap[1]}</span>
      </figcaption>
    </figure>
  );
}
