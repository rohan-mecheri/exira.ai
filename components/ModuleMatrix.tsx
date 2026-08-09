import { MODULES } from "@/lib/modules";

/* Section 03: all eleven modules at once. Nothing hidden behind an
   interaction.

   These read as coverage, not as findings. The tiles used to carry the
   output of one sample assessment, complete with a disposition dot, which
   made a catalogue of what we look at pretend to be a report.

   Eleven into a four-column grid leaves one cell short. The grid draws its
   rules as 1px gaps over a background, so an absent twelfth cell would
   show as a block of line colour: the blank tile fills it deliberately and
   is hidden at one column, where there is nothing to fill. */

export function ModuleMatrix() {
  return (
    <section className="sec" id="coverage">
      <div className="wrap">
        <div className="head rv">
          <p className="eyebrow">
            <i>03</i>Coverage
          </p>
          <h2>Eleven modules, reconciled against each other.</h2>
          <p className="lede">
            Each module reads one dimension of the codebase. The findings that move deals are the
            ones that only surface when the modules are read against each other, so every pass
            reconciles them before it reports.
          </p>
        </div>
        <div className="mods rv d1">
          {MODULES.map((m) => (
            <article key={m.id} className="md">
              <div className="top">
                <span className="id">{m.id}</span>
              </div>
              <h3>{m.name}</h3>
              <p>{m.does}</p>
            </article>
          ))}
          <article className="md blank" aria-hidden="true" />
        </div>
      </div>
    </section>
  );
}
