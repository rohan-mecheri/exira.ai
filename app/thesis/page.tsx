import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "@/components/Arrow";
import { Toc, type TocEntry } from "@/components/Toc";
import { SEGMENTS } from "@/lib/segments";

export const metadata: Metadata = {
  title: "Thesis",
  description:
    "Why technical due diligence gets automated, and why now. Exira's thesis on the software transaction market.",
};

const CONTENTS: readonly TocEntry[] = [
  { id: "s1", label: "The unevaluated asset" },
  { id: "s2", label: "Why the current model can't close it" },
  { id: "s3", label: "What breaks when cost collapses" },
  { id: "s4", label: "Where it applies" },
  { id: "s5", label: "Why a product wins" },
  { id: "s6", label: "What we are building" },
];

export default function Thesis() {
  return (
    <main>
      <div className="mast">
        <div className="wrap">
          <p className="eyebrow">Thesis</p>
          <h1>Technical diligence is a consulting practice. It should be a product.</h1>
          <p className="stand">
            Software is the most transacted asset class in private markets and the least
            systematically evaluated one. The constraint has never been demand. It has been that
            assessment required a scarce human, billed by the hour, on a timeline no deal can
            accommodate. That constraint is gone.
          </p>
          <div className="meta">
            <span>Exira</span>
            <span>August 2026</span>
            <span>~8 minute read</span>
          </div>
        </div>
      </div>

      <div className="wrap essay">
        <Toc entries={CONTENTS} />

        <div className="essay-body">
          <section id="s1">
            <h2>
              <span className="n">01</span>The unevaluated asset
            </h2>
            <p>
              When capital changes hands in a software deal, the thing actually being bought is a
              codebase. Not the ARR schedule, not the customer list; those are consequences. The
              code is what produces them, and it is the one asset in the transaction that nobody in
              the room can read.
            </p>
            <p>
              Financial diligence has a playbook. Legal has one. Commercial has one. Technical
              diligence has a phone number for a consultant, a three-week window, and a sampling
              strategy. The result is that the risk categories which recur most reliably across
              software transactions are also the ones most reliably left unpriced.
            </p>
            <div className="stats">
              <div className="stat">
                <div className="v">96%</div>
                <div className="l">
                  of CIOs have seen technical diligence uncover material issues in M&amp;A
                </div>
                <span className="s">Accenture</span>
              </div>
              <div className="stat">
                <div className="v">1 in 4</div>
                <div className="l">of CEOs actually run it on most transactions</div>
                <span className="s">Accenture</span>
              </div>
              <div className="stat">
                <div className="v">30–40%</div>
                <div className="l">
                  of unrealised value in acquisition targets sits in technology capability
                </div>
                <span className="s">Bain &amp; Company</span>
              </div>
            </div>
            <p>
              Read those together and the shape of the problem is clear. This is not a market that
              doubts the value of technical diligence. It is a market that cannot afford to run it.
            </p>
          </section>

          <section id="s2">
            <h2>
              <span className="n">02</span>Why the current model can&apos;t close the gap
            </h2>
            <p>
              The gap persists because of arithmetic, not ignorance. An enterprise consultancy bills
              $200–$800 an hour and delivers over months. A mid-market boutique charges $40K–$100K
              over three to four weeks. Both are priced per engagement and gated by the availability
              of a specific senior practitioner.
            </p>
            <p>That produces three structural failures, none of which more spending fixes:</p>
            <p className="small">
              <strong>It cannot run early.</strong> At $40K a look, diligence runs on the deal you
              have already decided to do. The screening decision, the one that determines which
              deals you pursue at all, is made without it.
            </p>
            <p className="small">
              <strong>It cannot run repeatedly.</strong> A snapshot ages. By the time a continuation
              vehicle or a secondary transaction prices an asset, the original assessment is three to
              five years stale, the codebase has turned over, and the engineering team may have too.
            </p>
            <p className="small">
              <strong>It cannot run consistently.</strong> Output quality tracks the individual
              assigned. Two engagements at the same firm produce materially different reports, which
              is why coverage is rarely end-to-end and why findings are hard to compare across a
              portfolio.
            </p>
            <div className="pull">
              <p>
                Every one of these is a consequence of a human bottleneck. None of them are
                consequences of the work being hard to specify.
              </p>
            </div>
          </section>

          <section id="s3">
            <h2>
              <span className="n">03</span>What breaks when the cost curve collapses
            </h2>
            <p>
              Take the same eleven-module assessment and move it from three weeks and $60K to a few
              hours at a fraction of the cost, and the change is not that firms get the same report
              faster. The change is that the report becomes a different instrument.
            </p>
            <p>
              <em>Diligence becomes screening.</em> If assessment is cheap enough to run pre-LOI, it
              runs on targets you would never have resourced. A firm looking at forty deals a year is
              suddenly making technical judgements on all forty rather than the eight that reached
              exclusivity. That is not a speed improvement; it is a wider field of view.
            </p>
            <p>
              <em>Diligence becomes monitoring.</em> The same engine re-run on a schedule through the
              hold period tracks debt accumulation, security drift and technical covenant signals. In
              credit, that is an early-warning system that does not currently exist in any form.
            </p>
            <p>
              <em>Diligence becomes preparation.</em> Run from the sell side twelve months out, the
              identical assessment surfaces what a buyer&apos;s diligence would surface, while remediation
              is still a sprint rather than a re-trade. Repeated quarterly, it produces a documented
              history of technical governance, which is an asset in a negotiation, not just a file.
            </p>
            <p>
              One engine, four moments in the life of an asset. The unit of value shifts from a
              report commissioned on one deal to an intelligence layer running across a pipeline and
              a portfolio.
            </p>
          </section>

          <section id="s4">
            <h2>
              <span className="n">04</span>Where it applies
            </h2>
            <p>
              The same assessment addresses seven distinct buyers. They differ in what they are
              underwriting, not in what needs to be examined.
            </p>
            <div className="seg">
              {SEGMENTS.map((s) => (
                <div key={s.n} className="sg">
                  <span className="k">{s.n}</span>
                  <div>
                    <h3>{s.name}</h3>
                    <p>{s.body}</p>
                    <span className="tag">{s.tag}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section id="s5">
            <h2>
              <span className="n">05</span>Why a product wins, and what it has to get right
            </h2>
            <p>
              Automation alone is not the thesis. Code scanners have existed for twenty years; they
              lose because they are sold to engineering teams to fix code, not to investors to price
              it. Their output is a backlog. An investment committee cannot read a backlog.
            </p>
            <p>Three things have to be true for a product to displace the practice:</p>
            <p className="small">
              <strong>The output has to be investor-grade.</strong> Technical condition translated
              into business consequence, remediation cost in engineering months, and transaction
              relevance. A finding that a deal team cannot act on is not a finding.
            </p>
            <p className="small">
              <strong>The analysis has to be reconciled, not parallel.</strong> Eleven modules
              producing eleven reports is eleven times the noise. Key-person concentration reads
              differently alongside three in-flight migrations; licensing exposure changes meaning
              next to an AI roadmap. The findings that move deals are cross-module, and they only
              appear if the modules are read against each other.
            </p>
            <p className="small">
              <strong>The target has to be able to say yes.</strong> This is the real gate. No
              portfolio company hands its source code to a third-party vendor because a prospective
              buyer asked. Any product that requires it is capped at the deals where the target has
              no leverage, which is not the deals worth doing.
            </p>
            <div className="pull">
              <p>
                The company that solves the trust problem gets to run on every deal. The company that
                does not is limited to the ones where nobody objects.
              </p>
            </div>
            <p>
              That is why the architecture is the go-to-market. An attested, ephemeral, single-tenant
              environment the target authorises and can revoke, where we receive the findings and
              never the repository, is not a security feature bolted onto a product. It is the thing
              that makes the product deployable across a portfolio at all.
            </p>
          </section>

          <section id="s6">
            <h2>
              <span className="n">06</span>What we are building
            </h2>
            <p>
              An assessment engine that reads a target&apos;s entire codebase across eleven modules,
              reconciles the findings against each other, subjects every conclusion to an independent
              critic pass, and returns an investor-grade report in hours, inside an environment the
              target controls and we cannot enter.
            </p>
            <p>
              The first proof is a complete assessment of a large, public production codebase of
              44,499 commits, 552 contributors and 1.23M lines, run across all eleven modules, with
              every finding carrying evidence references and a remediation estimate. It is the same
              output a deal team would receive inside an exclusivity window.
            </p>
            <div className="end">
              <p>
                This thesis will be wrong in places, and we would rather find out from someone doing
                these deals than from a spreadsheet. If you run software transactions, buy-side,
                sell-side, or credit, we would like to hear where it breaks.
              </p>
              <div className="cta-row">
                <Link className="btn" href="/#demo">
                  Book demo
                  <ArrowRight />
                </Link>
                <Link className="quiet" href="/#report">
                  See a real assessment
                </Link>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
