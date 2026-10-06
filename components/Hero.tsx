import { ArrowDown, ArrowRight } from "./Arrow";
import { HeroModel } from "./HeroModel";
import { BookDemo } from "./BookDemo";

export function Hero() {
  return (
    <section className="hero">
      <div className="wrap hero-grid">
        <div className="rv">
          <h1>
            Technical diligence<span className="b">for private capital</span>
          </h1>
          <p className="hero-stand">
            Institutional-grade software intelligence, from acquisition to exit.
          </p>
          <div className="hero-hr" />
          <div className="hero-cta">
            <BookDemo source="hero" className="btn btn-lg">
              Book demo
              <ArrowRight />
            </BookDemo>
            <a className="quiet" href="#report">
              See a real assessment
              <ArrowDown />
            </a>
          </div>
        </div>
        <div className="rv d2">
          <HeroModel />
        </div>
      </div>
    </section>
  );
}
