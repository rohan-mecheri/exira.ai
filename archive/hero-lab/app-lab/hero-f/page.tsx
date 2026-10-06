import { ArrowDown, ArrowRight } from "@/components/Arrow";
import { BookDemo } from "@/components/BookDemo";
import { HeroF } from "@/components/lab/f/HeroF";
import { Reveals } from "@/components/Reveals";

/* Lab copy of the home hero with Designer F's object. Temporary. */
export const metadata = { robots: { index: false } };

export default function HeroFLab() {
  return (
    <main id="top">
      <section className="hero" style={{ overflowX: "clip" }}>
        <div className="wrap hero-grid">
          <div className="rv">
            <h1>
              Technical diligence<span className="b">for private capital</span>
            </h1>
            <p className="hero-stand">Institutional-grade software intelligence, from acquisition to exit.</p>
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
            <HeroF />
          </div>
        </div>
      </section>
      <Reveals />
    </main>
  );
}
