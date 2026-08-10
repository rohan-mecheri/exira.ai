"use client";

import { useEffect, useRef, useState } from "react";
import { STAGES } from "@/lib/isolation";
import { PipelineSchematic } from "./PipelineSchematic";

/* Section 02 scroll-pinned sequence.

   The track is tall, the stage sticks, and four frames advance with scroll
   before releasing into section 03. Below 900px or with reduced motion it
   unpins and stacks all four.

   Track height is N * 78 + 100 vh — shorten by cutting a stage, not by
   shrinking the track, or the stepping gets twitchy.

   Scroll position is read imperatively, but everything downstream of it is
   ordinary state: the active index drives the steps, the frames and the
   schematic through props. */

const N = STAGES.length;

export function Pinned() {
  const trackRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
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

    // The bar is four segments rather than one sweep. A single bar creeping
    // across 400vh gives no sense of which stage you are in or how close
    // the next one is; four filling in turn makes the handover visible.
    const paintBar = (p: number) => {
      const bar = barRef.current;
      if (!bar) return;
      for (let j = 0; j < N; j++) {
        const seg = bar.children[j] as HTMLElement | undefined;
        if (seg) seg.style.setProperty("--f", String(Math.min(1, Math.max(0, p * N - j))));
      }
    };

    const onScroll = () => {
      if (!isPinned()) {
        paintBar(1);
        return;
      }
      const r = track.getBoundingClientRect();
      const span = track.offsetHeight - innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / span));
      setActive(Math.min(N - 1, Math.floor(p * N * 0.999)));
      paintBar(p);
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
      <div className="pin-track" ref={trackRef}>
        <div className="pin-stage">
          <div className="wrap pin-grid">
            <div className="pin-left">
              <div className="head">
                <p className="eyebrow">
                  <i>02</i>Isolation architecture
                </p>
                <h2>Architecturally unable to see your code.</h2>
                <p className="lede">
                  The target initiates the assessment, issues the only credential, and holds a
                  signed record of its lifecycle. Our inability to reach the source is enforced by
                  the architecture, not asserted by policy.
                </p>
              </div>
              <div className="steps">
                {STAGES.map((s, j) => (
                  <div
                    key={s.n}
                    className="step"
                    data-on={j === active ? "1" : "0"}
                    role="button"
                    tabIndex={0}
                    onClick={() => goTo(j)}
                    onKeyDown={(e) => {
                      if (e.key !== "Enter" && e.key !== " ") return;
                      e.preventDefault();
                      goTo(j);
                    }}
                  >
                    <span className="k">{s.n}</span>
                    <span className="t">{s.step}</span>
                  </div>
                ))}
              </div>
              <div className="pin-bar" ref={barRef}>
                {STAGES.map((s) => (
                  <i key={s.n} />
                ))}
              </div>
            </div>

            <div className="pin-right">
              <div className="schema">
                <PipelineSchematic step={active} hot={stage.hot} />
              </div>

              <div className="frames">
                {STAGES.map((s, j) => (
                  <article key={s.n} className="frame" data-on={j === active ? "1" : "0"}>
                    <span className="fk">
                      {s.n} · {s.step}
                    </span>
                    <h3>{s.heading}</h3>
                    <p>{s.body}</p>
                    <div className="spec">
                      {s.spec.map((row) => (
                        <div key={row.key}>
                          <b>{row.key}</b>
                          <span className={row.tone}>{row.value}</span>
                        </div>
                      ))}
                    </div>
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
