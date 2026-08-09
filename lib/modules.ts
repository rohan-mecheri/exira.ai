/* The module catalogue.

   This is the product's coverage, not the output of any one assessment.
   Section 03 renders it as a list of what each module examines; the
   dispositions, signals and findings that belong to a specific pass live
   with that pass, not here. */

export interface Module {
  /** M01-M11. */
  id: string;
  /** Module name, as it appears on the tile. */
  name: string;
  /** Uppercase label for the hero canvas callout. */
  short: string;
  /** What this module reads. Written as coverage, not as a finding. */
  does: string;
}

export const MODULES: readonly Module[] = [
  {
    id: "M01",
    name: "Key-person dependency",
    short: "KEY-PERSON",
    does: "Where authorship concentrates, who has already left, and which systems still depend on them.",
  },
  {
    id: "M02",
    name: "Security & vulnerability posture",
    short: "SECURITY",
    does: "Dependency exposure, patch latency, secret handling, and which controls the pipeline actually enforces.",
  },
  {
    id: "M03",
    name: "Scalability & cloud architecture",
    short: "SCALABILITY",
    does: "Service boundaries, data flow, and what the architecture does at the next order of magnitude.",
  },
  {
    id: "M04",
    name: "Engineering organisation health",
    short: "ENG HEALTH",
    does: "Throughput, review discipline and test practice, read from repository history rather than claimed.",
  },
  {
    id: "M05",
    name: "Compliance & regulatory posture",
    short: "COMPLIANCE",
    does: "Which obligations are enforced in code, which are asserted on paper, and what needs verifying out of band.",
  },
  {
    id: "M06",
    name: "IP & licensing risk",
    short: "LICENSING",
    does: "Every dependency licence, how it combines with the product's own distribution, and what survives the transaction.",
  },
  {
    id: "M07",
    name: "Technology modernisation risk",
    short: "MODERNISATION",
    does: "Runtime, framework and platform versions against their support horizons, and the upgrades already overdue.",
  },
  {
    id: "M08",
    name: "AI & ML readiness",
    short: "AI & ML",
    does: "Whether AI capability is built in or bolted on: provider dependence, evaluation discipline, data foundations.",
  },
  {
    id: "M09",
    name: "Integration compatibility",
    short: "INTEGRATION",
    does: "The surface the product exposes and consumes, and the real cost of integrating it with an acquirer.",
  },
  {
    id: "M10",
    name: "FinOps & cloud cost efficiency",
    short: "FINOPS",
    does: "The architectural decisions that drive infrastructure spend, and whether cost control exists in code.",
  },
  {
    id: "M11",
    name: "Technical debt",
    short: "TECH DEBT",
    does: "Deferred work carried in the codebase, converted into remediation effort in engineering months.",
  },
];

export interface LifecycleEvent {
  at: string;
  event: string;
  detail: string;
}

/** Signed lifecycle record from a real pass. Not yet rendered; this is the
    spine of the /assessment page. */
export const LIFECYCLE_RECORD: readonly LifecycleEvent[] = [
  { at: "09:14:02", event: "authorisation issued", detail: "4 repositories, read-only" },
  { at: "09:14:03", event: "environment provisioned", detail: "digest a91f…3c07, attested" },
  { at: "09:14:07", event: "repository cloned", detail: "direct from provider over TLS" },
  { at: "09:14:09", event: "credentials erased", detail: "post-checkout" },
  { at: "09:41:55", event: "analysis complete", detail: "11 modules, 46 findings" },
  { at: "09:41:57", event: "report sealed", detail: "sha256 7e2b…9d14" },
  { at: "09:42:01", event: "environment destroyed", detail: "storage keys discarded" },
];
