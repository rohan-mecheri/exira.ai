import { ArrowRight } from "./Arrow";
import { BookDemo } from "./BookDemo";

/* The close. One CTA — see docs/website-spec.md §1. */

export function Cta() {
  return (
    <section className="cta" id="demo">
      <div className="wrap cta-in">
        <h2 className="rv">Pick a codebase. See what we find.</h2>
        <div className="rv d1">
          <BookDemo source="close" className="btn btn-lg">
            Book demo
            <ArrowRight />
          </BookDemo>
        </div>
      </div>
    </section>
  );
}
