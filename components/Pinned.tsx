"use client";

import { useEffect, useRef, useState } from "react";
import { STAGES } from "@/lib/isolation";
import { PipelineSchematic } from "./PipelineSchematic";

/* Section 02 scroll-pinned sequence.

   The track is tall, the stage sticks, and four frames advance with scroll
   before releasing into section 03. Below 900px or with reduced motion it
   unpins: the stage is then chosen by hand (the rail, or the diagram's
   caption on small screens) and the drawing and text follow it together.

   Track height is N * 78 + 100 vh — shorten by cutting a stage, not by
   shrinking the track, or the stepping gets twitchy.

   That height is also set inline on first render, not only inside the
   effect below. An anchor link to a later section (e.g. /#report) is
   resolved by the browser against the server-rendered HTML, before any
   client JS runs — if the track started at its unpinned, contentless
   height and only grew to N * 78 + 100 vh once the effect fired, the
   browser would already have scrolled to a position that this section
   then expands underneath, leaving the viewport stranded inside it
   instead of at the target further down the page.

   Scroll position is read imperatively, but everything downstream of it is
   ordinary state: the active index drives the steps, the frames and the
   schematic through props. */

const N = STAGES.length;

export function Pinned() {
  const trackRef = useRef<HTMLDivElement>(null);
  const railRef = useRef<HTMLOListElement>(null);
  const [active, setActive] = useState(0);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;

    const isPinned = () =>
      matchMedia("(min-width:901px)").matches &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches;

    const layout = () => {
      track.style.height = isPinned() ? `${N * 78 + 100}vh` : "auto";
    };

    // Progress lives on the rail itself: each step's left bar fills with
    // the scroll through its own stage, so the rail reads as one line that
    // advances, and the stage you are in is the one whose bar is filling.
    // Unpinned (null), the inline fill is cleared and the stylesheet's
    // default applies: the active step's bar full, the rest empty.
    const paintRail = (p: number | null) => {
      const rail = railRef.current;
      if (!rail) return;
      for (let j = 0; j < N; j++) {
        const li = rail.children[j] as HTMLElement | undefined;
        if (!li) continue;
        if (p === null) li.style.removeProperty("--f");
        else li.style.setProperty("--f", String(Math.min(1, Math.max(0, p * N - j))));
      }
    };

    const onScroll = () => {
      if (!isPinned()) {
        paintRail(null);
        return;
      }
      const r = track.getBoundingClientRect();
      const span = track.offsetHeight - innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / span));
      setActive(Math.min(N - 1, Math.floor(p * N * 0.999)));
      paintRail(p);
    };

    const onResize = () => {
      layout();
      onScroll();
    };

    layout();
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });
    addEventListener("resize", onResize);
    return () => {
      removeEventListener("scroll", onScroll);
      removeEventListener("resize", onResize);
    };
  }, []);

  // Clicking a step scrolls the track to where that stage is showing;
  // unpinned, it just switches the frame.
  const goTo = (j: number) => {
    const track = trackRef.current;
    const pinned =
      matchMedia("(min-width:901px)").matches &&
      !matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!track || !pinned) {
      setActive(j);
      return;
    }
    const span = track.offsetHeight - innerHeight;
    scrollTo({ top: track.offsetTop + span * ((j + 0.4) / N), behavior: "smooth" });
  };

  const stage = STAGES[active];

  return (
    <section className="pin" id="security">
      <div className="pin-track" ref={trackRef} style={{ height: `${N * 78 + 100}vh` }}>
        <div className="pin-stage">
          <div className="wrap pin-grid">
            <div className="pin-left">
              <div className="head">
                <h2>Architecturally unable to see your code</h2>
                <p className="lede">
                  The target initiates the assessment, authorises the environment directly, and
                  receives a signed record of everything that happened inside it. Our inability to
                  reach the source is enforced by the architecture, not asserted by policy.
                </p>
              </div>
              <ol className="steps" ref={railRef} aria-label="Stages of an assessment">
                {STAGES.map((s, j) => (
                  <li key={s.step} className="step" data-on={j === active ? "1" : "0"}>
                    <button
                      type="button"
                      aria-current={j === active ? "step" : undefined}
                      onClick={() => goTo(j)}
                    >
                      {s.step}
                    </button>
                  </li>
                ))}
              </ol>
            </div>

            <div className="pin-right">
              <div className="schema">
                <PipelineSchematic step={active} hot={stage.hot} onPick={goTo} />
              </div>

              <div className="frames">
                {STAGES.map((s, j) => (
                  <article key={s.step} className="frame" data-on={j === active ? "1" : "0"}>
                    <h3>{s.heading}</h3>
                    <p>{s.body}</p>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
