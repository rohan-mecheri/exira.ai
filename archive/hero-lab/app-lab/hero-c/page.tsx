import { ArrowDown, ArrowRight } from "@/components/Arrow";
import { BookDemo } from "@/components/BookDemo";
import { Reveals } from "@/components/Reveals";
import { HeroC } from "@/components/lab/c/HeroC";

/* Lab route for Designer C. A copy of the production hero layout with
   the experimental object. Temporary: deleted before commit. */

export const metadata = { title: "Hero lab C", robots: { index: false } };

export default function HeroLabC() {
  return (
    <main id="top">
      <section className="hero">
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
            <HeroC />
          </div>
        </div>
      </section>
      {/* Stand-in for the rest of the page, so scroll and touch can be tested. */}
      <section id="report" style={{ minHeight: "120vh" }} />
      <Reveals />
    </main>
  );
}
