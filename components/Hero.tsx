import { ArrowDown, ArrowRight } from "./Arrow";
import { Instrument } from "./Instrument";

export function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div className="rv">
          <p className="eyebrow">Automated technical due diligence</p>
          <h1>
            The codebase is the asset.<span className="b">Read it like one.</span>
          </h1>
          <p className="hero-sub">
            Eleven modules against the target&apos;s entire repository. Investor-grade findings in
            hours — without us ever receiving the code.
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
