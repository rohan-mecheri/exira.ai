import { ArrowRight } from "./Arrow";
import { BookDemo } from "./BookDemo";

/* The close. One CTA — see docs/website-spec.md §1. */

export function Cta() {
  return (
    <section className="cta" id="demo">
      <div className="wrap cta-in">
        <p className="eyebrow rv">Book demo</p>
        <h2 className="rv d1">Walk through a live target. See exactly what the assessment surfaces.</h2>
        <p className="lede rv d2">
          A thirty-minute session — we walk through a complete assessment module by module, then apply
          it to a target in your pipeline.
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
