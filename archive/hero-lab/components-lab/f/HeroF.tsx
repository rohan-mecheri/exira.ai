"use client";

import { useEffect, useRef, useState } from "react";
import type { HeroHandle, PartHit } from "@/lib/lab/f/scene";
import css from "./heroF.module.css";

/* Designer F lab: "The Reader". The stage takes input; the canvas bleeds
   past it. On hover four quiet labels name the parts; a click names one. */
const LABELS = [
  ["code", "Your codebase", "ne"],
  ["modules", "Eleven modules", "n"],
  ["sealed", "Sealed environment", "s"],
  ["finding", "Finding", "ne"],
] as const;

export function HeroF() {
  const stageRef = useRef<HTMLDivElement>(null);
  const labelRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const handle = useRef<HeroHandle | null>(null);
  const [part, setPart] = useState<PartHit | null>(null);

  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    const coarse = matchMedia("(hover: none), (pointer: coarse)").matches;
    let dead = false;
    let visible = false;
    let timer = 0;
    const sync = () => handle.current?.setActive(visible && !document.hidden);
    import("@/lib/lab/f/scene").then(({ mount }) => {
      if (dead) return;
      const l = labelRefs.current;
      handle.current = mount(stage, {
        reduce,
        coarse,
        labels: l.code && l.modules && l.sealed && l.finding ? { code: l.code, modules: l.modules, sealed: l.sealed, finding: l.finding } : null,
        onPart: (p) => {
          setPart(p);
          clearTimeout(timer);
          if (p) timer = window.setTimeout(() => setPart(null), 3200);
        },
        onReady: () => {},
      });
      if (process.env.NODE_ENV !== "production") (window as unknown as { __heroF?: HeroHandle }).__heroF = handle.current;
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
      clearTimeout(timer);
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
      handle.current?.dispose();
      handle.current = null;
    };
  }, []);

  const onKey = (e: React.KeyboardEvent) => {
    const h = handle.current;
    if (!h) return;
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      h.toggleOpen();
    } else if (e.key === "ArrowLeft" || e.key === "ArrowRight") {
      e.preventDefault();
      h.nudge(e.key === "ArrowLeft" ? -0.25 : 0.25);
    } else if (e.key === "Escape") h.setOpen(false);
  };

  const flip = part ? part.x > (stageRef.current?.clientWidth ?? 0) * 0.55 : false;
  return (
    <figure className={css.fig}>
      <div
        ref={stageRef}
        className={css.stage}
        role="img"
        aria-roledescription="interactive model"
        aria-label="A sealed box. A sheet of code goes in at the left, eleven windows along the top light one by one as eleven modules check it, and a single finding comes out at the right. Press Enter to run it with labels."
        tabIndex={0}
        onKeyDown={onKey}
      >
        {LABELS.map(([k, text, dir]) => (
          <div
            key={k}
            ref={(el) => {
              labelRefs.current[k] = el;
            }}
            className={css.label}
            data-dir={dir}
            aria-hidden="true"
          >
            <span className={css.ldot} />
            <span className={css.lline} />
            <span className={css.ltext}>{text}</span>
          </div>
        ))}
        {part && (
          <div className={css.tag} data-flip={flip || undefined} style={{ left: part.x, top: part.y }} aria-live="polite">
            <span className={css.dot} />
            <span className={css.lead} />
            <span className={css.card}>
              <strong>{part.title}</strong>
              <span>{part.body}</span>
            </span>
          </div>
        )}
      </div>
    </figure>
  );
}
