import { Scramble } from "./Scramble";

/* Section 04: what actually lands in the data room.

   The header used to announce "Technical Due Diligence, confidential",
   which said nothing a reader could not already see. It now shows what a
   real deliverable would show and we cannot: the client, enciphered. The
   identifier never settles, which is the point.

   The scope row used to run eight tiles across two rows and took more
   space than the finding it was framing. Four remain, and they describe
   the shape of the output rather than the size of the input, because the
   size of the input is not what a deal team is buying.

   .doc here is the report card and only the report card; the thesis body
   grid is .essay. */

const SCOPE: readonly { value: string; label: string }[] = [
  { value: "1.23M", label: "Lines read" },
  { value: "46", label: "Findings raised" },
  { value: "3", label: "Cross-module risks" },
  { value: "0", label: "Deal-blocking" },
];

export function Report() {
  return (
    <section className="sec" id="report">
      <div className="wrap">
        <div className="head rv">
          <p className="eyebrow">
            <i>04</i>The deliverable
          </p>
          <h2>What lands in the data room.</h2>
          <p className="lede">
            Every finding carries a disposition, a remediation estimate in engineering months, and a
            traceable evidence reference.
          </p>
        </div>
        <div className="doc-wrap rv d1">
          <article className="doc">
            <div className="doc-h">
              <svg viewBox="-15 -15 493 464" aria-hidden="true">
                <use href="#sym-icon" />
              </svg>
              <Scramble className="doc-client" text="7E2B9D14A91F" charset="hex" />
              <span className="t">Assessment report</span>
              <span className="m">June 2026 · 11 modules</span>
            </div>
            <div className="scope rv d2">
              {SCOPE.map((s) => (
                <div key={s.label} className="sc">
                  <div className="v">{s.value}</div>
                  <div className="l">{s.label}</div>
                </div>
              ))}
            </div>
            <div className="doc-b">
              <p className="doc-sect">Material risk · highest attention</p>
              <div className="dfind rv d3">
                <span className="fid">
                  F-0118 · M03 SCALABILITY × M11 TECHNICAL DEBT · CROSS-MODULE
                </span>
                <h3>Three concurrent infrastructure migrations in flight</h3>
                <p>
                  The event streaming backbone, the caching and job-queue layer, and the data access
                  layer for user identity are simultaneously mid-migration. Each is individually
                  justified and each is executed responsibly, with dual-write patterns that keep old
                  and new systems in sync. The risk is not the migrations but their concurrent,
                  in-flight state: three simultaneous transitions introduce operational complexity
                  and a window of exposure to data inconsistency until each is closed out.
                </p>
                <div className="refs">
                  <b>disposition</b>confirm completion dates pre-close
                  <br />
                  <b>remediation</b>1–2 months streaming · 1–2 months cache · 2–3 months identity
                  <br />
                  <b>evidence</b>3 refs · dual-write helpers, migration config, routing fallback
                  <br />
                  <b>critic</b>upheld · severity unchanged · no contradictory evidence
                </div>
              </div>
            </div>
          </article>
          <div className="doc-veil">
            <span>Book a demo to walk the full assessment</span>
          </div>
        </div>
      </div>
    </section>
  );
}
