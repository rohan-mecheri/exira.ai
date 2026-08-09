import { ArrowDown, ArrowRight } from "./Arrow";
import { Instrument } from "./Instrument";

export function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div className="rv">
          <p className="eyebrow">Buy-side · Sell-side · Private credit</p>
          <h1>
            Technical diligence<span className="b">in hours, not weeks.</span>
          </h1>
          <p className="hero-stand">
            Institutional-grade software intelligence, from acquisition to exit.
          </p>
          <p className="hero-sub">
            Eleven modules read the target&apos;s entire repository. The target runs the pass and
            keeps the source; we receive the findings.
          </p>
          <div className="hero-hr" />
          <div className="hero-cta">
            <a className="btn btn-lg" href="#demo">
              Book demo
              <ArrowRight />
            </a>
            <a className="quiet" href="#report">
              See a real assessment
              <ArrowDown />
            </a>
          </div>
        </div>
        <div className="rv d2">
          <Instrument />
        </div>
      </div>
    </section>
  );
}
