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
    source: "Source: Verizon / Yahoo, 2017",
  },
  {
    amount: "$30M",
    unit: "Unbudgeted, post-close",
    text: "A platform acquisition where the target's ERP could not integrate. Found after signing, so it could not be negotiated into the price.",
    source: "Source: RSM case file",
  },
  {
    amount: "5–25%",
    unit: "Off the agreed price",
    text: "Software transactions are re-traded on 30–40% of deals, once the buyer surfaces code, security or licensing exposure during diligence.",
    source: "Source: PitchBook aggregate data",
  },
];

export function Gap() {
  return (
    <section className="sec gap">
      <div className="wrap">
        <p className="gap-lede rv">Every software deal is priced on a codebase nobody read</p>
        <div className="cases">
          {CASES.map((c, i) => (
            <article key={c.source} className={i === 0 ? "case rv" : `case rv d${i}`}>
              <div className="amt">{c.amount}</div>
              <div className="unit">{c.unit}</div>
              <p className="txt">{c.text}</p>
              <p className="src">{c.source}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
