/* Section 01 — the problem, stated once, at size. */

interface Case {
  amount: string;
  unit: string;
  text: string;
  source: string;
}

const CASES: readonly Case[] = [
  {
    amount: "$350M",
    unit: "Off the purchase price",
    text: "Undisclosed data breaches surfaced during late-stage diligence, after the price had been agreed rather than before.",
    source: "Verizon / Yahoo · 2017",
  },
  {
    amount: "$30M",
    unit: "Unbudgeted, post-close",
    text: "A platform acquisition where the target's ERP could not integrate. Found after signing, so it could not be negotiated into the price.",
    source: "RSM case file",
  },
  {
    amount: "5–25%",
    unit: "Off the agreed price",
    text: "Software transactions are re-traded on 30–40% of deals, once the buyer surfaces code, security or licensing exposure during diligence.",
    source: "PitchBook · aggregate",
  },
];

export function Gap() {
  return (
    <section className="sec">
      <div className="wrap">
        <p className="eyebrow rv">
          <i>01</i>What goes unpriced
        </p>
        <p className="gap-lede rv d1">Every software deal is priced on a codebase nobody read.</p>
        <div className="cases">
          {CASES.map((c, i) => (
            <article key={c.source} className={i === 0 ? "case rv" : `case rv d${i}`}>
              <span className="mk" />
              <div className="amt">{c.amount}</div>
              <div className="unit">{c.unit}</div>
              <p className="txt">{c.text}</p>
              <p className="src">{c.source}</p>
            </article>
          ))}
        </div>
        <p className="gap-foot rv d3">
          None of these were hidden. They were simply never looked for. Technical diligence costs
          $40K–$300K and takes weeks, so it runs on the deal you have already decided to do, if it
          runs at all.
        </p>
      </div>
    </section>
  );
}
