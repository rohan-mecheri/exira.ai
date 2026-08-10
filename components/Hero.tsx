import { ArrowDown, ArrowRight } from "./Arrow";
import { Instrument } from "./Instrument";

export function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div className="rv">
          <p className="eyebrow">Buy-side · Sell-side · Private credit</p>
          <h1>
            Underwrite the code.<span className="b">Not just the numbers.</span>
          </h1>
          <p className="hero-stand">
            Institutional-grade software intelligence, from acquisition to exit.
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
