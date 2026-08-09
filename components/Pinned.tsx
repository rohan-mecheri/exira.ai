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
  const barRef = useRef<HTMLElement>(null);
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

    const onScroll = () => {
      const bar = barRef.current;
      if (!isPinned()) {
        if (bar) bar.style.width = "100%";
        return;
      }
      const r = track.getBoundingClientRect();
      const span = track.offsetHeight - innerHeight;
      const p = Math.min(1, Math.max(0, -r.top / span));
      setActive(Math.min(N - 1, Math.floor(p * N * 0.999)));
      if (bar) bar.style.width = `${(p * 100).toFixed(1)}%`;
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
                  The assessment is initiated and controlled by the target. It executes inside a
                  confidential enclave that Exira cannot enter, view or manipulate — not by policy,
                  by construction.
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
              <div className="pin-bar">
                <i ref={barRef} />
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
      <div className="wrap">
        <p className="pin-note">
          Where that level of isolation is not required, the same eleven modules run under an
          engagement NDA with time-limited read-only access —{" "}
          <b>faster to stand up, lower cost, identical output.</b>
        </p>
      </div>
    </section>
  );
}
