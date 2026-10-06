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

export interface Stage {
  /** Label in the left-hand steps rail. */
  step: string;
  heading: string;
  body: string;
  /** Schematic parts highlighted while this stage is showing. The
      boundary (n-sealed) is lit only in stage 01, where it is the subject;
      in the later stages the parts crossing it are. */
  hot: readonly SchemaId[];
}

export const STAGES: readonly Stage[] = [
  {
    step: "Provable isolation",
    heading: "Neither Exira nor the cloud provider can see inside",
    body: "The analysis engine is built, signed and locked to one verified version before anything starts. It runs on hardware that keeps its memory encrypted while the work happens, closed to the operators of the machine it runs on as much as to us. The target confirms the environment is running that approved version before releasing anything to it.",
    hot: ["n-sealed"],
  },
  {
    step: "Single-use access",
    heading: "Access is never issued to us",
    body: "The target authorises the environment directly. The key covers only the repositories it selects, and its private half is created inside the environment and can never be copied out, so it is cryptographically bound to that single run and worthless anywhere else. Exira is never a party to it. It lapses when the checkout finishes, and the target can withdraw it sooner.",
    hot: ["n-target", "f-auth"],
  },
  {
    step: "Sealed execution",
    heading: "Source never leaves the environment it lands in",
    body: "The repository is pulled over an encrypted connection straight from the target's own provider into storage that exists only for that run. Nothing routes through Exira. Analysis happens where the code already sits: inside the environment it is processed as data rather than run, and nothing the repository asserts can change how that analysis behaves.",
    hot: ["n-repo", "f-clone"],
  },
  {
    step: "Verified teardown",
    heading: "The report leaves. The environment is destroyed",
    body: "Findings leave as a structured register, validated against a published schema. Evidence travels as file paths, line ranges and content hashes, so the report points at code without ever containing any. The environment and its keys are then destroyed, and the target receives a signed, tamper-evident audit record: what was authorised, what ran, what left, and when it was torn down.",
    hot: ["n-policy", "n-exira", "f-out", "f-del"],
  },
];
