"use client";

import { useEffect, useRef } from "react";
import type { HeroHandle } from "@/lib/lab/d/scene";
import css from "./heroD.module.css";

export function HeroD() {
  const stageRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = matchMedia("(hover: none), (pointer: coarse)").matches;
    let dead = false;
    let h: HeroHandle | null = null;
    let visible = false;
    const sync = () => h?.setActive(visible && !document.hidden);
    import("@/lib/lab/d/scene").then(({ mount }) => {
      if (dead) return;
      h = mount(stage, { reduce, coarse, onPart: () => {}, onReady: () => {} });
      if (process.env.NODE_ENV !== "production") (window as unknown as { __heroD?: HeroHandle }).__heroD = h;
      sync();
    });
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      sync();
    });
    io.observe(stage);
    document.addEventListener("visibilitychange", sync);
    return () => {
      dead = true;
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      h?.dispose();
    };
  }, []);
  return (
    <figure className={css.fig}>
      <div
        ref={stageRef}
        className={css.stage}
        role="img"
        aria-roledescription="interactive model"
        aria-label="A sealed instrument case of eleven segments around a hidden core. Open it to see the eleven modules read the code and check each other, and a single finding leave through the port."
        tabIndex={0}
      />
    </figure>
  );
}
