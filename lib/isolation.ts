/* Section 02: the four stages of an assessment, and which parts of the
   schematic each one lights up.

   Register. Precise, not jargonised. The previous draft reached for
   digest, hypervisor, trust boundary, attestation evidence and egress,
   which reads as technical to someone who already knows the field and as
   noise to the partner who has to forward it. Everything here says the
   same thing in words that land on first read: signed and locked to one
   version, memory encrypted while it runs, no login, the key works
   nowhere else. Specific enough for an engineer to check, plain enough
   for a deal partner to repeat.

   Headings state the guarantee and stop. The mechanism goes in the body,
   which is where "cryptographically bound" belongs.

   Stage 04 no longer says findings are screened for source fragments. If
   we never hold the source, screening the output for it implies we might,
   and that undercuts the section. The register carries references rather
   than excerpts by construction, which is the stronger statement.

   What stays out: our image formats, registries, broker internals and the
   specific classes of repository-supplied input we neutralise. The moat
   is the assessment engine. Residency stays unclaimed; the fine-tune is
   claimed under the module matrix and in thesis section 06. */

/** Node and flow ids in the pipeline schematic. */
export type SchemaId =
  | "n-repo"
  | "n-target"
  | "n-sealed"
  | "n-policy"
  | "n-exira"
  | "f-auth"
  | "f-out"
  | "f-del"
  | "f-clone";

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
    step: "Provable isolation",
    heading: "Isolation is enforced in hardware, not by policy.",
    body: "The analysis engine is built, signed and locked to one verified version before anything starts. It runs on hardware that encrypts its own memory while the work happens, so neither the cloud provider nor Exira can read what is inside it. The target confirms the environment is running that approved version before releasing anything to it.",
    spec: [
      { key: "environment", value: "memory stays encrypted while it runs" },
      { key: "version", value: "signed and locked before the run starts" },
      { key: "access", value: "no login, no remote shell, no support route", tone: "w" },
      { key: "readable by", value: "not the cloud provider, not Exira" },
      { key: "confirmed by", value: "the target, before anything is released", tone: "g" },
    ],
    hot: ["n-sealed", "n-policy"],
  },
  {
    n: "02",
    step: "Single-use access",
    heading: "Access is issued to the environment, never to us.",
    body: "The target authorises the environment directly. The key covers only the repositories it selects, and its private half is created inside the environment and can never be copied out, so it is cryptographically bound to that single run and worthless anywhere else. Exira is never a party to it. It lapses when the checkout finishes, and the target can withdraw it sooner.",
    spec: [
      { key: "authorised by", value: "the target, straight to the environment" },
      { key: "covers", value: "only the repositories the target selects" },
      { key: "private half", value: "created inside, never copied out", tone: "w" },
      { key: "exira", value: "never a party to the credential" },
      { key: "withdrawal", value: "target-side, at any time, without notice", tone: "g" },
    ],
    hot: ["n-target", "n-sealed", "f-auth"],
  },
  {
    n: "03",
    step: "Sealed execution",
    heading: "Source never leaves the environment it lands in.",
    body: "The repository is pulled over an encrypted connection straight from the target's own provider into storage that exists only for that run. Nothing routes through Exira. Analysis happens where the code already sits: inside the environment it is processed as data rather than run, and nothing the repository asserts can change how that analysis behaves.",
    spec: [
      { key: "transfer", value: "provider to environment, encrypted and direct" },
      { key: "routing", value: "nothing passes through Exira", tone: "w" },
      { key: "storage", value: "exists only for that run" },
      { key: "handling", value: "processed as data, never run" },
      { key: "retention", value: "nothing kept, model training included", tone: "g" },
    ],
    hot: ["n-repo", "n-sealed", "f-clone"],
  },
  {
    n: "04",
    step: "Verified teardown",
    heading: "The report leaves. The environment is destroyed.",
    body: "Findings leave as a structured register, validated against a published schema. Evidence travels as file paths, line ranges and content hashes, so the report points at code without ever containing any. The environment and its keys are then destroyed, and the target receives a signed, tamper-evident audit record: what was authorised, what ran, what left, and when it was torn down.",
    spec: [
      { key: "leaves", value: "the findings register and report, under NDA" },
      { key: "evidence", value: "file paths, line ranges, content hashes" },
      { key: "never leaves", value: "the checkout, the key, any working data", tone: "w" },
      { key: "destroyed", value: "the environment and its keys, on close" },
      { key: "audit record", value: "signed, tamper-evident, issued to the target", tone: "g" },
    ],
    hot: ["n-sealed", "n-policy", "n-exira", "f-out", "f-del"],
  },
];
