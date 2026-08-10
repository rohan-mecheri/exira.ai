/* Section 04: what actually lands in the data room.

   The card has to read as a document, not a dashboard. The version with
   eight big stat tiles read as the latter and buried the finding; the
   version with four and nothing else was thin, one finding floating in a
   lot of white.

   So the numbers are a masthead strip now, one line, and the body is what
   a report body actually is: a register down the side and the lead finding
   opened up beside it. The register runs past the fold so the veil cuts it
   mid-list, which is the honest shape of a preview.

   .doc here is the report card and only the report card; the thesis body
   grid is .essay. */

interface Figure {
  value: string;
  label: string;
}

/* Two banded rows rather than a wall of tiles: what went in, then what
   came out. Eight big tiles took more height than the finding they were
   framing; four told you nothing about the scale of the read. */
const SCOPE: readonly Figure[] = [
  { value: "44,499", label: "commits" },
  { value: "17,942", label: "files" },
  { value: "552", label: "contributors" },
  { value: "1.23M", label: "lines" },
];

const OUTPUT: readonly Figure[] = [
  { value: "46", label: "findings" },
  { value: "3", label: "cross-module" },
  { value: "2", label: "to verify" },
  { value: "2", label: "deal-blocking" },
];

type Severity = "blocking" | "material" | "attention" | "noted";

interface RegisterRow {
  id: string;
  module: string;
  severity: Severity;
  /** The one opened out beside the register. */
  expanded?: boolean;
}

/* Eight of forty-six, ordered by severity, so the two blocking findings
   sit at the top where a real register would put them. The veil takes the
   tail. */
const REGISTER: readonly RegisterRow[] = [
  { id: "F-0131", module: "M02", severity: "blocking" },
  { id: "F-0127", module: "M06", severity: "blocking" },
  { id: "F-0118", module: "M03 × M11", severity: "material", expanded: true },
  { id: "F-0092", module: "M02", severity: "attention" },
  { id: "F-0071", module: "M06", severity: "attention" },
  { id: "F-0064", module: "M04", severity: "noted" },
  { id: "F-0055", module: "M11", severity: "noted" },
  { id: "F-0043", module: "M05", severity: "attention" },
  { id: "F-0031", module: "M09", severity: "noted" },
  { id: "F-0028", module: "M07", severity: "noted" },
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
              <span className="doc-client" aria-hidden="true">
                PostHog
              </span>
              <span className="t">Assessment report</span>
              <span className="m">June 2026 · 11 modules</span>
            </div>

            <div className="doc-strip rv d2">
              <span className="dsl">Read</span>
              {SCOPE.map((f) => (
                <div key={f.label} className="dst">
                  <span className="v">{f.value}</span>
                  <span className="l">{f.label}</span>
                </div>
              ))}
              <span className="dsl">Raised</span>
              {OUTPUT.map((f) => (
                <div key={f.label} className="dst">
                  <span className="v">{f.value}</span>
                  <span className="l">{f.label}</span>
                </div>
              ))}
            </div>

            <div className="doc-b rv d3">
              <div className="doc-reg">
                <p className="reg-h">Findings register</p>
                <div className="reg">
                  {REGISTER.map((r) => (
                    <div
                      key={r.id}
                      className={r.expanded ? "reg-i on" : "reg-i"}
                      data-sev={r.severity}
                    >
                      <span className="rid">{r.id}</span>
                      <span className="rmod">{r.module}</span>
                      <span className="rdot" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="doc-lead">
                <p className="doc-sect">Material risk · cross-module</p>
                <div className="dfind">
                  <span className="fid">
                    F-0118 · M03 SCALABILITY × M11 TECHNICAL DEBT · CROSS-MODULE
                  </span>
                  <h3>Three concurrent infrastructure migrations in flight</h3>
                  <p>
                    The event streaming backbone, the caching and job-queue layer, and the data
                    access layer for user identity are simultaneously mid-migration. Each is
                    individually justified and each is executed responsibly, with dual-write patterns
                    that keep old and new systems in sync. The risk is not the migrations but their
                    concurrent, in-flight state: three simultaneous transitions introduce operational
                    complexity and a window of exposure to data inconsistency until each is closed
                    out.
                  </p>
                  <div className="refs">
                    <b>disposition</b>close out or price before signing
                    <br />
                    <b>remediation</b>1–2 months streaming · 1–2 months cache · 2–3 months identity
                    <br />
                    <b>evidence</b>3 refs · dual-write helpers, migration config, routing fallback
                    <br />
                    <b>critic</b>upheld · severity unchanged · no contradictory evidence
                  </div>
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
