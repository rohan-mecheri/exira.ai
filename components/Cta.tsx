import { ArrowRight } from "./Arrow";

/* The close. One CTA — see docs/website-spec.md §1. */

export function Cta() {
  return (
    <section className="cta" id="demo">
      <div className="wrap cta-in">
        <p className="eyebrow rv">Book demo</p>
        <h2 className="rv d1">Bring a live deal. We&apos;ll show you what the pass finds.</h2>
        <p className="lede rv d2">
          Twenty minutes. We walk a complete assessment module by module, then talk about a target in
          your pipeline.
        </p>
        <div className="rv d3">
          <a className="btn btn-lg" href="mailto:hello@exira.io?subject=Exira%20demo">
            Book demo
            <ArrowRight />
          </a>
        </div>
        <p className="n rv d3">Buy-side · sell-side · private credit · portfolio monitoring</p>
      </div>
    </section>
  );
}
