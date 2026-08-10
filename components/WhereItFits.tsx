/* Section 05 — one engine, four moments. */

interface Moment {
  phase: string;
  heading: string;
  body: string;
}

const MOMENTS: readonly Moment[] = [
  {
    phase: "Screening · pre-LOI",
    heading: "Look before you commit",
    body: "Run it on targets you would never resource a full engagement for. Firms doing this aren't just faster; they see more of the market.",
  },
  {
    phase: "Exclusivity",
    heading: "Findings while price is open",
    body: "Architecture, security, licensing and remediation cost in engineering months, while there is still a number to move.",
  },
  {
    phase: "Hold period",
    heading: "Drift, tracked",
    body: "Scheduled re-runs track debt accumulation, security drift and technical covenant signals months before they reach revenue.",
  },
  {
    phase: "Exit",
    heading: "Find it before they do",
    body: "The same assessment, read from the other side: what a buyer's diligence would surface, while remediation is still a sprint.",
  },
];

interface Contrast {
  before: string;
  after: string;
  note: string;
}

const CONTRASTS: readonly Contrast[] = [
  { before: "2–3 weeks", after: "Hours", note: "Fits inside exclusivity" },
  { before: "$40K–$300K", after: "A fraction", note: "Viable earlier in the funnel" },
  { before: "Sampled scope", after: "Eleven modules", note: "Same coverage every run" },
  { before: "One snapshot", after: "Scheduled", note: "Through hold, into exit" },
];

export function WhereItFits() {
  return (
    <section className="sec">
      <div className="wrap">
        <div className="head rv">
          <p className="eyebrow">
            <i>05</i>Where it fits
          </p>
          <h2>One engine, four moments.</h2>
          <p className="lede">
            At this cost and turnaround, technical diligence stops being something you commission
            once and becomes a screen, then a monitor, then a defence.
          </p>
        </div>
        <div className="tl">
          {MOMENTS.map((m, i) => (
            <div key={m.phase} className={i === 0 ? "tl-i rv" : `tl-i rv d${i}`}>
              <span className="mk" />
              <span className="ph">{m.phase}</span>
              <h3>{m.heading}</h3>
              <p>{m.body}</p>
            </div>
          ))}
        </div>
        <div className="contrast rv">
          {CONTRASTS.map((c) => (
            <div key={c.note} className="ct">
              <span className="mk" />
              <div className="a">{c.before}</div>
              <div className="b">{c.after}</div>
              <div className="c">{c.note}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
