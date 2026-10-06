import { MODULES } from "@/lib/modules";

/* Section 03: all eleven modules at once. Nothing hidden behind an
   interaction.

   These read as coverage, not as findings. The tiles used to carry the
   output of one sample assessment, complete with a disposition dot, which
   made a catalogue of what we look at pretend to be a report.

   Eleven into a four-column grid leaves one cell short, and the grid draws
   its rules as 1px gaps over a background, so an absent twelfth cell would
   show as a block of line colour. That cell carries the note about how the
   modules are judged: it has to be filled, and this is the one thing on
   the page that belongs beside the coverage rather than beneath it. Its
   deeper ground marks it as a note rather than a twelfth module, and
   twelve cells divide evenly at four, three, two and one column. */

export function ModuleMatrix() {
  return (
    <section className="sec" id="coverage">
      <div className="wrap">
        <div className="head rv">
          <h2>Eleven modules, checked against each other</h2>
          <p className="lede">
            Each module reads one part of the codebase. The findings that move a price usually
            sit where two of them meet, so every assessment cross-checks them before it reports.
          </p>
        </div>
        <div className="mods rv d1">
          {MODULES.map((m) => (
            <article key={m.id} className="md">
              <h3>{m.name}</h3>
              <p>{m.does}</p>
            </article>
          ))}
          <article className="md note">
            <h3>Weighted by what moved a price</h3>
            <p>
              Our models are fine-tuned on completed assessments and the deal outcomes that
              followed. An independent critic reviews every conclusion before it reaches you.
            </p>
          </article>
        </div>
      </div>
    </section>
  );
}
