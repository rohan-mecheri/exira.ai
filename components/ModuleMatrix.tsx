import { ASSESSMENT_TOTALS, MODULES } from "@/lib/modules";

/* Section 03: all eleven modules rendered at once as a matrix.
   Nothing is hidden behind an interaction.

   This used to be an innerHTML template string, which meant a module
   missing a field produced an empty cell in the page rather than an error
   at build time. Module is a required-field interface now, so it doesn't. */

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
            Key-person concentration reads differently alongside three in-flight migrations. Below is
            the register from a live assessment of a production analytics platform.
          </p>
        </div>
        <div className="mods rv d1">
          {MODULES.map((m) => (
            <article key={m.id} className="md" data-s={m.signal}>
              <div className="top">
                <span className="id">{m.id}</span>
                <span className="dot" title={m.disposition} />
              </div>
              <h3>{m.name}</h3>
              <p>{m.tile}</p>
            </article>
          ))}
          <article className="md sum">
            <span className="l">Assessment total</span>
            <ul>
              {ASSESSMENT_TOTALS.map((t) => (
                <li key={t.label}>
                  <b>{t.value}</b> {t.label}
                </li>
              ))}
            </ul>
          </article>
        </div>
      </div>
    </section>
  );
}
