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
  { value: "1.23M", label: "lines of code" },
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
  severity: Severity;
  /** The one opened out beside the register. */
  expanded?: boolean;
}

/* Eight of forty-six, ordered by severity, so the two blocking findings
   sit at the top where a real register would put them. The veil takes the
   tail. */
const REGISTER: readonly RegisterRow[] = [
  { id: "F-0131", severity: "blocking" },
  { id: "F-0127", severity: "blocking" },
  { id: "F-0118", severity: "material", expanded: true },
  { id: "F-0092", severity: "attention" },
  { id: "F-0071", severity: "attention" },
  { id: "F-0064", severity: "noted" },
  { id: "F-0055", severity: "noted" },
  { id: "F-0043", severity: "attention" },
  { id: "F-0031", severity: "noted" },
  { id: "F-0028", severity: "noted" },
];

export function Report() {
  return (
    <section className="sec" id="report">
      <div className="wrap">
        <div className="head rv">
          <h2>A real assessment, redacted</h2>
          <p className="lede">
            Each finding is given a disposition and a remediation estimate in engineering months,
            and points to the evidence behind it.
          </p>
        </div>

        <div className="doc-wrap rv d1">
          <article className="doc">
            <div className="doc-h">
              <svg viewBox="-15 -15 493 464" aria-hidden="true">
                <use href="#sym-icon" />
              </svg>
              <span className="doc-client" aria-hidden="true">
                Redacted
              </span>
              <span className="t">Assessment report</span>
              <span className="m">June 2026 · 11 modules</span>
            </div>

            <div className="doc-strip rv d2">
              <span className="dsl">Analysed</span>
              {SCOPE.map((f) => (
                <div key={f.label} className="dst">
                  <span className="v">{f.value}</span>
                  <span className="l">{f.label}</span>
                </div>
              ))}
              <span className="dsl">Reported</span>
              {OUTPUT.map((f) => (
                <div key={f.label} className="dst">
                  <span className="v">{f.value}</span>
                  <span className="l">{f.label}</span>
                </div>
              ))}
            </div>

            <div className="doc-b rv d3">
              <div className="doc-reg">
                <div className="reg">
                  {REGISTER.map((r) => (
                    <div
                      key={r.id}
                      className={r.expanded ? "reg-i on" : "reg-i"}
                      data-sev={r.severity}
                    >
                      <span className="rid">{r.id}</span>
                      <span className="rdot" />
                    </div>
                  ))}
                </div>
              </div>

              <div className="doc-lead">
                <p className="doc-sect">Material risk across two modules</p>
                <div className="dfind">
                  <h3>Three infrastructure migrations running at once</h3>
                  <p>
                    The event streaming backbone, the caching and job-queue layer and the identity
                    data-access layer are all mid-migration at the same time. Each migration is
                    justified and well run, with dual-write patterns keeping old and new systems in
                    sync. The concern is that all three are open together. That adds operational
                    complexity and leaves room for data inconsistency until each one is closed out.
                  </p>
                  <dl className="refs">
                    <dt>Disposition</dt>
                    <dd>Close out or price in before signing</dd>
                    <dt>Remediation</dt>
                    <dd>Streaming 1–2 months, cache 1–2 months, identity 2–3 months</dd>
                    <dt>Evidence</dt>
                    <dd>3 references: dual-write helpers, migration config, routing fallback</dd>
                    <dt>Critic review</dt>
                    <dd>Upheld, severity unchanged, no contradicting evidence</dd>
                  </dl>
                </div>
              </div>
            </div>
          </article>
          <div className="doc-veil">
            <span>Book a demo to see the full assessment</span>
          </div>
        </div>
      </div>
    </section>
  );
}
