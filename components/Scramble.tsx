"use client";

import { useEffect, useRef } from "react";
import { CHARSET_ALNUM, CHARSET_HEX, scramble } from "@/lib/scramble";

/* Perpetual decrypt-style text loop. The repeat — run, hold, run again —
   lives here rather than in lib/scramble.ts, which only ever knows how to
   do a single pass; that keeps the primitive reusable for one-shot reveals
   elsewhere later.

   The settled string is server-rendered, so there is no hydration
   mismatch and no layout shift: scrambling only ever starts once the
   effect below has mounted in the browser. The real text lives on
   aria-label; the animating span is aria-hidden so screen readers read
   the word, never the noise in between. */

export interface ScrambleProps {
  text: string;
  /** Which exported charset to draw from. Default "alnum". */
  charset?: "alnum" | "hex";
  /** Forwarded to scramble(). */
  speed?: number;
  /** Forwarded to scramble(). */
  revealDelay?: number;
  /** Pause, in ms, after a run resolves before the next one starts. Default 3500. */
  holdMs?: number;
  className?: string;
}

export function Scramble({
  text,
  charset = "alnum",
  speed,
  revealDelay,
  holdMs = 3500,
  className,
}: ScrambleProps) {
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Respect the user's preference outright — leave the server-rendered
    // final text on screen and never touch the timer machinery below.
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const set = charset === "hex" ? CHARSET_HEX : CHARSET_ALNUM;

    let disposed = false;
    let loopRunning = false;
    let visible = false;
    let cancelRun: (() => void) | null = null;
    let holdTimer: ReturnType<typeof setTimeout> | null = null;
    let wake: (() => void) | null = null;

    const waitVisible = () =>
      new Promise<void>((resolve) => {
        if (visible) {
          resolve();
          return;
        }
        wake = resolve;
      });

    // Off-screen means the interval inside scramble() is pure waste, so a
    // scroll-out cancels the in-flight run and parks the loop at
    // waitVisible() instead of letting it hold-then-restart unseen.
    const loop = async () => {
      if (loopRunning) return;
      loopRunning = true;

      while (!disposed) {
        if (!visible) {
          await waitVisible();
          if (disposed) break;
        }

        const run = scramble(el, text, { charset: set, speed, revealDelay });
        cancelRun = run.cancel;
        await run.done;
        cancelRun = null;

        // A late resolve — unmount or a visibility drop mid-run — must not
        // fall through into scheduling a hold and another pass.
        if (disposed || !visible) continue;

        await new Promise<void>((resolve) => {
          holdTimer = setTimeout(resolve, holdMs);
        });
        holdTimer = null;
        if (disposed) break;
      }

      loopRunning = false;
    };

    const stop = () => {
      if (holdTimer !== null) {
        clearTimeout(holdTimer);
        holdTimer = null;
      }
      cancelRun?.();
      cancelRun = null;
    };

    let io: IntersectionObserver | null = null;

    if ("IntersectionObserver" in window) {
      io = new IntersectionObserver(
        (entries) => {
          const isVisible = entries.some((e) => e.isIntersecting);
          visible = isVisible;
          if (isVisible) {
            wake?.();
            wake = null;
            loop();
          } else {
            stop();
          }
        },
        { threshold: 0 }
      );
      io.observe(el);
    } else {
      // No observer support — treat the element as always visible rather
      // than never animating.
      visible = true;
      loop();
    }

    return () => {
      disposed = true;
      wake?.();
      wake = null;
      stop();
      io?.disconnect();
    };
  }, [text, charset, speed, revealDelay, holdMs]);

  return (
    <span className={className} aria-label={text}>
      <span ref={ref} aria-hidden="true">
        {text}
      </span>
    </span>
  );
}
