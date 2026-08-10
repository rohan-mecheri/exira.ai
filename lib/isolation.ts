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
    heading: "The target issues access that works nowhere else.",
    body: "The target issues one key covering only the repositories it selects. The private half of that key is created inside the environment and can never be copied out, so the key is cryptographically bound to that single run and is useless anywhere else, Exira's own systems included. It expires when the checkout finishes, and the target can revoke it sooner.",
    spec: [
      { key: "issued by", value: "the target, for the repositories it picks" },
      { key: "key", value: "single use, expires when checkout finishes" },
      { key: "private half", value: "created inside, never copied out", tone: "w" },
      { key: "our systems", value: "never hold a key that works" },
      { key: "revocation", value: "target-side, at any time, without notice", tone: "g" },
    ],
    hot: ["n-target", "n-sealed", "f-auth"],
  },
  {
    n: "03",
    step: "Sealed execution",
    heading: "Source never transits Exira infrastructure.",
    body: "The repository is fetched over an encrypted connection straight from the target's own provider onto storage that exists only for that run. Exira operates no proxy and holds no copy. The code is read as data and never executed, and any instruction it carries about how our tools should behave is discarded.",
    spec: [
      { key: "transfer", value: "provider to environment, encrypted, no proxy" },
      { key: "storage", value: "exists only for that run, then goes" },
      { key: "handling", value: "read as data, never executed", tone: "w" },
      { key: "network", value: "reaches nothing beyond the source provider" },
      { key: "retention", value: "nothing kept, model training included", tone: "g" },
    ],
    hot: ["n-repo", "n-sealed", "f-clone", "f-block"],
  },
  {
    n: "04",
    step: "Export and teardown",
    heading: "The report leaves. The environment is destroyed.",
    body: "Findings leave as a structured register, checked against a published schema before release. Evidence travels as file paths, line ranges and content hashes, so the report can point at code without ever containing any. When the approved window closes, the environment and its keys are destroyed and the target keeps a signed record of what ran.",
    spec: [
      { key: "leaves", value: "the findings register and report, under NDA" },
      { key: "evidence", value: "file paths, line ranges, content hashes" },
      { key: "never leaves", value: "the checkout, the key, any working data", tone: "w" },
      { key: "destroyed", value: "the environment and its keys, at the end" },
      { key: "record", value: "signed and tamper-evident, held by the target", tone: "g" },
    ],
    hot: ["n-sealed", "n-policy", "n-exira", "f-out", "f-del"],
  },
];
