/* Section 02: the four stages of a pass, and which parts of the
   schematic each one lights up.

   These read as claims, not as a runbook. Everything here is something a
   technical buyer can hold us to; nothing here is a description of how it
   is built. Where the earlier copy named the mechanism (image formats,
   registries, broker internals, the specific classes of repository input
   we neutralise) it has been pulled back to the guarantee, because that
   detail is the part a competitor could read once and copy. */

/** Node and flow ids in the pipeline schematic. */
export type SchemaId =
  | "n-target"
  | "n-enclave"
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
    step: "Workload attestation",
    heading: "What runs is fixed before anything is authorised.",
    body: "The analysis engine is built, signed, and pinned to an immutable measurement. The environment launches that measurement and nothing else. Before granting any access the target verifies attestation evidence for itself, rather than taking our word for what is running. No interactive path into that environment exists, for us or for anyone.",
    spec: [
      { key: "build", value: "signed, immutable, independently verifiable" },
      { key: "launch", value: "pinned measurement, nothing else runs" },
      { key: "access", value: "no interactive path in, ours included", tone: "w" },
      { key: "proof", value: "attestation verified target-side", tone: "g" },
    ],
    hot: ["n-enclave", "n-boundary"],
  },
  {
    n: "02",
    step: "Scoped authorisation",
    heading: "The credential is minted where we cannot hold it.",
    body: "The target chooses what is in scope and issues a read-only grant bound to that scope and to a single job. It is minted inside the attested environment rather than on our infrastructure, so the ordinary Exira control plane never handles a usable credential at any point. The grant dies at checkout, and the target can revoke sooner.",
    spec: [
      { key: "grant", value: "read-only, scope-bound, single use" },
      { key: "minted", value: "inside attestation, never on our infrastructure" },
      { key: "control plane", value: "never holds a usable credential", tone: "w" },
      { key: "lifetime", value: "expires at checkout" },
      { key: "revocation", value: "target-side, at any point", tone: "g" },
    ],
    hot: ["n-target", "n-enclave", "f-auth"],
  },
  {
    n: "03",
    step: "Sealed execution",
    heading: "The repository is treated as hostile input.",
    body: "Source arrives directly from the provider onto encrypted storage inside the environment. We are not a proxy and hold no copy. It is read as data rather than executed, and any instruction the repository asserts about how our tooling should behave is disregarded. Network egress is closed by default.",
    spec: [
      { key: "storage", value: "encrypted, ephemeral, one tenant per pass" },
      { key: "execution", value: "read as data, not run" },
      { key: "repo instructions", value: "disregarded by default", tone: "w" },
      { key: "egress", value: "closed unless explicitly opened" },
      { key: "training", value: "never, ours or a provider's", tone: "g" },
    ],
    hot: ["n-enclave", "f-clone", "f-block", "n-boundary"],
  },
  {
    n: "04",
    step: "Export and destruction",
    heading: "Only a schema-validated register leaves.",
    body: "Findings pass an output policy before release. The register is schema-checked and screened for anything resembling source or secrets, and raw tooling output stays inside. Evidence travels as references rather than excerpts. At the end of the approved window the environment is destroyed, and the target keeps a signed record that it was.",
    spec: [
      { key: "released", value: "findings register, report, evidence references" },
      { key: "withheld", value: "checkout, credentials, raw tooling output", tone: "w" },
      { key: "evidence", value: "references, never excerpts" },
      { key: "destruction", value: "environment and every intermediate" },
      { key: "record", value: "signed, tamper-evident, held by the target", tone: "g" },
    ],
    hot: ["n-enclave", "n-policy", "n-exira", "f-out", "f-del"],
  },
];
