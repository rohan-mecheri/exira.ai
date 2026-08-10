/* Section 02: the four stages of an assessment, and which parts of the
   schematic each one lights up.

   Register. The reader is a deal partner who will forward this to an
   engineer, or an engineer sitting in the room while the partner pitches
   it. So the vocabulary is the vocabulary of the field: attestation,
   digest pinning, memory encryption in use, key binding, non-exportable
   private keys, default-deny egress. Vague reassurance ("an output
   check", "read-only access") fails both readers, because the partner
   cannot repeat it and the engineer does not believe it.

   Where it still stops. Naming the standard mechanisms is table stakes
   and gives nothing away. Naming our image formats, registries, broker
   internals or the specific classes of repository-supplied input we
   neutralise would, so those stay out. The moat is the assessment engine,
   not the fact that we run it on confidential compute.

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
    step: "Attested runtime",
    heading: "No operator path exists into the runtime, ours included.",
    body: "The analysis engine ships as a signed image with a fixed digest and executes on confidential compute, where memory is encrypted in use and the host and hypervisor sit outside the trust boundary. The target verifies attestation evidence binding that digest to the live instance before releasing anything to it.",
    spec: [
      { key: "runtime", value: "confidential compute, memory encrypted in use" },
      { key: "image", value: "signed, digest-pinned, no build tooling present" },
      { key: "operator plane", value: "none: no SSH, console or support path", tone: "w" },
      { key: "trust boundary", value: "excludes the host, the hypervisor and Exira" },
      { key: "proof", value: "attestation evidence verified target-side", tone: "g" },
    ],
    hot: ["n-sealed", "n-boundary"],
  },
  {
    n: "02",
    step: "Key-bound authorisation",
    heading: "Credentials are cryptographically bound to that runtime.",
    body: "The target issues a single-use authorisation bound to a public key that exists only inside the attested runtime. Its private half is generated in memory there and is non-exportable, so the credential cannot be replayed anywhere else, Exira infrastructure included. Scope is fixed at issue, it expires at checkout, and the target can revoke without notice.",
    spec: [
      { key: "authorisation", value: "single-use, scope fixed at issue" },
      { key: "binding", value: "to a public key held only in the runtime" },
      { key: "private key", value: "generated in memory, non-exportable", tone: "w" },
      { key: "our systems", value: "never hold a replayable credential" },
      { key: "revocation", value: "target-side, immediate, without notice", tone: "g" },
    ],
    hot: ["n-target", "n-sealed", "f-auth"],
  },
  {
    n: "03",
    step: "Sealed execution",
    heading: "Source never transits Exira infrastructure.",
    body: "The clone is fetched over TLS directly from the target's provider onto encrypted ephemeral storage inside the runtime. Exira operates no proxy and holds no copy. Repository contents are parsed as untrusted data, never executed, and any instruction they carry about tool behaviour is discarded. Egress is default-deny.",
    spec: [
      { key: "transfer", value: "provider to runtime over TLS, no proxy" },
      { key: "storage", value: "encrypted, ephemeral, single tenant per run" },
      { key: "handling", value: "parsed as untrusted data, never executed", tone: "w" },
      { key: "egress", value: "default-deny, allow-list only" },
      { key: "retention", value: "none, model provider training included", tone: "g" },
    ],
    hot: ["n-sealed", "f-clone", "f-block", "n-boundary"],
  },
  {
    n: "04",
    step: "Controlled export",
    heading: "One schema-validated artifact crosses the boundary.",
    body: "Every finding is validated against a published schema and screened for source fragments, credentials and secrets before release. Evidence travels as file paths, line ranges and content hashes, never excerpts. When the approved window closes the runtime, its keys and all intermediate state are destroyed, and the target retains a signed, tamper-evident record of the lifecycle.",
    spec: [
      { key: "released", value: "findings register and report, under NDA" },
      { key: "evidence", value: "paths, line ranges and content hashes" },
      { key: "withheld", value: "the clone, credentials, raw tool output", tone: "w" },
      { key: "destruction", value: "runtime, keys and all intermediate state" },
      { key: "record", value: "signed, tamper-evident, held by the target", tone: "g" },
    ],
    hot: ["n-sealed", "n-policy", "n-exira", "f-out", "f-del"],
  },
];
