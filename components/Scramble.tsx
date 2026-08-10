"use client";

import { useEffect, useRef } from "react";
import { CHARSET_ALNUM, CHARSET_HEX, obfuscate } from "@/lib/scramble";

/* A value that is never shown. The cipher runs continuously rather than
   resolving and re-running on a timer: a decrypt that completes, even
   briefly, leaves the value readable on screen, and a withheld client
   name should never be readable.

   The settled string is server-rendered so there is no hydration mismatch
   and no layout shift, and the obfuscation only ever starts once this
   effect has mounted in the browser. The real text lives on aria-label;
   the animating span is aria-hidden, so assistive tech reads the value and
   never the noise.

   It still parks when scrolled off screen. Nobody is looking at a timer
   they cannot see, and the interval is pure waste until it comes back. */

export interface ScrambleProps {
  text: string;
  /** Which exported charset to draw from. Default "alnum". */
  charset?: "alnum" | "hex";
  /** Milliseconds between ticks. */
  speed?: number;
  /** Milliseconds between one character passing under the wave and the next. */
  revealDelay?: number;
  className?: string;
}

export function Scramble({ text, charset = "alnum", speed, revealDelay, className }: ScrambleProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect the preference outright: leave the server-rendered text and
    // never start a timer.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const set = charset === "hex" ? CHARSET_HEX : CHARSET_ALNUM;
    let disposed = false;
    let visible = false;
    let locked = false;
    let run: { stop: () => void } | null = null;
    let rz: ReturnType<typeof setTimeout> | undefined;

    /* This is set in proportional type, so every substituted character is
       a different width and whatever sits beside it would move on each
       tick. The box is pinned to the widest rendering the charset can
       produce, not to the settled string: the settled one is whatever
       letters the real value happens to use, and a run of W and @ is far
       wider than a run of I and L, so pinning to it lets the cipher spill
       over its neighbour. Widest character comes from canvas metrics,
       which cost no layout; the probe itself is measured in the DOM so
       letter-spacing is accounted for. */
    const lockWidth = () => {
      el.style.display = "inline-block";
      el.style.overflow = "hidden";
      el.style.width = "";
      el.textContent = text;
      const settled = el.getBoundingClientRect().width;

      let bound = settled;
      const ctx = document.createElement("canvas").getContext("2d");
      if (ctx) {
        const cs = getComputedStyle(el);
        ctx.font = `${cs.fontStyle} ${cs.fontWeight} ${cs.fontSize} ${cs.fontFamily}`;
        if ("letterSpacing" in ctx) ctx.letterSpacing = cs.letterSpacing;

        const widths = Array.from(set, (c) => ctx.measureText(c).width);
        const mean = widths.reduce((a, w) => a + w, 0) / widths.length;
        const variance = widths.reduce((a, w) => a + (w - mean) ** 2, 0) / widths.length;

        const chars = Array.from(text);
        const n = chars.filter((c) => !/\s/.test(c)).length;
        const spaces = chars
          .filter((c) => /\s/.test(c))
          .reduce((a, c) => a + ctx.measureText(c).width, 0);

        /* The widest glyph is roughly 1.7x the mean, so reserving n times
           the widest leaves a gap wide enough to break the masthead line.
           A sum of n glyph widths concentrates far more tightly than any
           single one: four standard deviations of that sum is a width the
           cipher effectively never reaches, and overflow:hidden absorbs
           the remaining tail by trimming a pixel off a noise glyph. */
        bound = n * mean + 4 * Math.sqrt(variance * n) + spaces;
      }

      el.style.width = `${Math.ceil(Math.max(settled, bound))}px`;
      locked = true;
    };

    const start = () => {
      if (run || disposed || !visible) return;
      if (!locked) lockWidth();
      run = obfuscate(el, text, { charset: set, speed, revealDelay });
    };

    const stop = () => {
      run?.stop();
      run = null;
      el.textContent = text;
    };

    // Webfont metrics differ from the fallback, and a breakpoint can change
    // the type size, so the measurement is retaken both times.
    const remeasure = () => {
      if (disposed) return;
      const wasRunning = run !== null;
      stop();
      lockWidth();
      if (wasRunning) start();
    };

    const onResize = () => {
      clearTimeout(rz);
      rz = setTimeout(remeasure, 150);
    };

    lockWidth();
    if (document.fonts) document.fonts.ready.then(remeasure);
    addEventListener("resize", onResize);

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          visible = entries.some((e) => e.isIntersecting);
          if (visible) start();
          else stop();
        },
        { threshold: 0 }
      );
      io.observe(el);
    } else {
      // No observer support: run rather than never animating.
      visible = true;
      start();
    }

    return () => {
      disposed = true;
      clearTimeout(rz);
      removeEventListener("resize", onResize);
      io?.disconnect();
      run?.stop();
      run = null;
    };
  }, [text, charset, speed, revealDelay]);

  return (
    <span className={className} aria-label={text}>
      <span ref={ref} aria-hidden="true">
        {text}
      </span>
    </span>
  );
}
