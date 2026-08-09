/* Section 02: the four stages of a pass, and which parts of the
   schematic each one lights up.

   Two rules govern this copy.

   The target is the actor, we are the constrained party. Every heading
   used to take a piece of our machinery as its grammatical subject: the
   credential is minted, the repository is treated, a register leaves. The
   passive voice hid who was being restrained and the reader's own asset
   never appeared as the thing being protected, so an accurate section
   read as a controls inventory. These are the four sentences an operating
   partner has to be able to repeat to a nervous CTO.

   And it states guarantees, never mechanism. No image formats, no
   registries, no broker internals, no named cloud products, and no list
   of the specific repository-supplied inputs we neutralise. That detail
   is the part a competitor reads once and copies.

   Deliberately absent, both pending the founder's sign-off: any claim of
   data residency, and any claim of a fine-tuned or proprietary model.
   See docs/website-spec.md section 9. */

/** Node and flow ids in the pipeline schematic. */
export type SchemaId =
  | "n-target"
  | "n-sealed"
  | "n-policy"
  | "n-exira"
  | "n-boundary"
  | "f-auth"
  | "f-out"
  | "f-del"
  | "f-clone"
  | "f-block";

/** `g` reads as reassurance, `w` as something to note. */
export type SpecTone = "g" | "w";

export interface SpecRow {
  key: string;
  value: string;
  tone?: SpecTone;
}

export interface Stage {
  /** 01-04, as printed. */
  n: string;
  /** Label in the left-hand steps rail. */
  step: string;
  heading: string;
  body: string;
  spec: readonly SpecRow[];
  /** Schematic parts highlighted while this stage is showing. */
  hot: readonly SchemaId[];
}

export const STAGES: readonly Stage[] = [
  {
    n: "01",
    step: "No way in",
    heading: "Nobody can enter the environment, including us.",
    body: "The target starts the pass. What runs is fixed and signed beforehand, and the environment launches that measurement and nothing else. The target verifies this itself rather than taking our word for it. There is no console, no shell and no support path in, so no account of ours can be compelled to read the code.",
    spec: [
      { key: "initiated", value: "by the target, on its own authority" },
      { key: "workload", value: "signed, immutable, one measurement only" },
      { key: "entry", value: "no console, no shell, no support path", tone: "w" },
      { key: "our access", value: "no privilege level exists for us" },
      { key: "proof", value: "attestation the target verifies itself", tone: "g" },
    ],
    hot: ["n-sealed", "n-boundary"],
  },
  {
    n: "02",
    step: "Target-issued access",
    heading: "We never hold a credential to the repository.",
    body: "The target chooses what is in scope and issues one read-only authorisation, bound to that scope and to a single pass. It is minted inside the sealed environment and works nowhere else, so there is no key on our systems to leak, subpoena or reuse. It expires at checkout, and the target can revoke it sooner.",
    spec: [
      { key: "grant", value: "read-only, scope-bound, single pass" },
      { key: "minted", value: "inside the environment, not on our systems" },
      { key: "our systems", value: "never hold a usable credential", tone: "w" },
      { key: "lifetime", value: "expires at checkout" },
      { key: "revocation", value: "target-side, at any point, without asking us", tone: "g" },
    ],
    hot: ["n-target", "n-sealed", "f-auth"],
  },
  {
    n: "03",
    step: "The code stays put",
    heading: "Source never reaches us and is never trained on.",
    body: "The pass pulls the repository straight from the provider into encrypted storage inside the sealed environment. We are never in the path and hold no copy. Code is read as data, never executed, and anything it asserts about how our tooling should behave is ignored. Nothing is retained for training, by us or by any provider.",
    spec: [
      { key: "transfer", value: "provider to environment, we are not a proxy" },
      { key: "storage", value: "encrypted, ephemeral, one tenant per pass" },
      { key: "execution", value: "read as data, repository instructions ignored", tone: "w" },
      { key: "egress", value: "closed by default, inbound and outbound" },
      { key: "training", value: "never, ours or a provider's", tone: "g" },
    ],
    hot: ["n-sealed", "f-clone", "f-block", "n-boundary"],
  },
  {
    n: "04",
    step: "Only the report leaves",
    heading: "One report leaves. Everything else is destroyed.",
    body: "Findings pass an output check before release, screened for anything resembling source or secrets. Evidence travels as references, never excerpts. When the approved window closes, the environment, the credential and every intermediate are destroyed, and the target keeps a signed, tamper-evident record that it happened.",
    spec: [
      { key: "released", value: "findings register and report, under NDA" },
      { key: "withheld", value: "checkout, credentials, raw tool output", tone: "w" },
      { key: "evidence", value: "references, never excerpts" },
      { key: "destroyed", value: "environment, credential, every intermediate" },
      { key: "record", value: "signed, tamper-evident, held by the target", tone: "g" },
    ],
    hot: ["n-sealed", "n-policy", "n-exira", "f-out", "f-del"],
  },
];
