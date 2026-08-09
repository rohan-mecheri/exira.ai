/* Thesis §04 — the seven buyers of the same assessment.
   Typed rather than inlined because the segment landing pages
   (private credit, sell-side) will render from this same list. */

export interface Segment {
  /** 01–07, as printed in the rail. */
  n: string;
  name: string;
  body: string;
  /** The one-line positioning tag under each entry. */
  tag: string;
}

export const SEGMENTS: readonly Segment[] = [
  {
    n: "01",
    name: "Private equity and M&A",
    body: "Technology accounted for roughly a quarter of US PE deployment by value in 2024, across more than 1,200 software transactions. Lower mid-market firms running 5–15 software deals a year are the most underserved: highest deal volume, least internal technical capability, worst fit with consulting economics.",
    tag: "Core market",
  },
  {
    n: "02",
    name: "Private credit and debt financing",
    body: "Lending against SaaS businesses has grown from roughly $8B in 2015 to over $500B, about a fifth of direct lending. Lenders underwriting a term loan against a software company have no instrument for assessing whether the technical asset backing the collateral is sound. Technical covenants are increasingly written into these agreements, and nobody is monitoring them.",
    tag: "Structurally underserved",
  },
  {
    n: "03",
    name: "Cyber insurance underwriting",
    body: "Around three in four carriers now run external attack-surface scans during underwriting. Those tools assess the perimeter. Roughly a fifth of cyber claims were denied or partly denied in 2025, and about a third of those denials traced to failure to maintain attested controls. Carriers are litigating against risks their underwriting never reached.",
    tag: "Adjacent",
  },
  {
    n: "04",
    name: "Venture diligence",
    body: "Diligence periods have lengthened materially since 2022 while most firms still have no in-house engineering capability. The problem is acute for AI-native investments, where architectural claims about model capability and data infrastructure are the investment thesis and no partner can independently verify them.",
    tag: "Emergent",
  },
  {
    n: "05",
    name: "Sell-side readiness",
    body: "Most companies entering a sale process carry material technical problems a buyer will find. Sell-side technical diligence exists as a consulting practice but costs tens of thousands and is inaccessible to the typical founder. Quarterly assessment through the pre-sale window is only possible at product economics.",
    tag: "Same engine, other side",
  },
  {
    n: "06",
    name: "Secondaries and continuation vehicles",
    body: "Secondary volume rose sharply in 2024, with continuation vehicles taking a growing share of all PE exit activity. Buyers price these stakes on financial performance alone, against a technical assessment that is years stale, inside evaluation windows a consulting engagement cannot fit.",
    tag: "No incumbent",
  },
  {
    n: "07",
    name: "Corporate strategic M&A",
    body: "Integration failure accounts for a large share of failed mergers, and preventing it requires understanding both codebases before signing. Assessing API architecture, data model and identity-layer compatibility between acquirer and target is not offered as a standalone deliverable by anyone.",
    tag: "Unserved capability",
  },
];
