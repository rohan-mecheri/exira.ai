"use client";

import { useEffect, useRef } from "react";
import { CHARSET_ALNUM, CHARSET_HEX, obfuscate } from "@/lib/scramble";

/* A value that is never shown. The cipher runs continuously rather than
   resolving and re-running on a timer: a decrypt that completes, even
   briefly, leaves the value readable on screen, and a withheld client
   identifier should never be readable.

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
    // never start a timer. The value is an identifier rather than a name,
    // so a static one gives nothing away.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const set = charset === "hex" ? CHARSET_HEX : CHARSET_ALNUM;
    let run: { stop: () => void } | null = null;

    const start = () => {
      if (!run) run = obfuscate(el, text, { charset: set, speed, revealDelay });
    };
    const stop = () => {
      run?.stop();
      run = null;
      el.textContent = text;
    };

    let io: IntersectionObserver | null = null;
    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => (entries.some((e) => e.isIntersecting) ? start() : stop()),
        { threshold: 0 }
      );
      io.observe(el);
    } else {
      // No observer support: run rather than never animating.
      start();
    }

    return () => {
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
