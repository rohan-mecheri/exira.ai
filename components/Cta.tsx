import { ArrowRight } from "./Arrow";
import { BookDemo } from "./BookDemo";

/* The close. One CTA — see docs/website-spec.md §1. */

export function Cta() {
  return (
    <section className="cta" id="demo">
      <div className="wrap cta-in">
        <p className="eyebrow rv">Book demo</p>
        <h2 className="rv d1">Bring a live deal. We&apos;ll show you what the assessment finds.</h2>
        <p className="lede rv d2">
          Thirty minutes. We walk a complete assessment module by module, then talk about a target in
          your pipeline.
        </p>
        <div className="rv d3">
          <BookDemo source="close" className="btn btn-lg">
            Book demo
            <ArrowRight />
          </BookDemo>
        </div>
      </div>
    </section>
  );
}
