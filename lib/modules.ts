/* The module catalogue.

   This is the product's coverage, not the output of any one assessment.
   Section 03 renders it as a list of what each module examines; the
   dispositions, signals and findings that belong to a specific pass live
   with that pass, not here. */

export interface Module {
  /** M01-M11. Internal key only; never printed. */
  id: string;
  /** Module name, as it appears on the tile. */
  name: string;
  /** Short label for the hero canvas callout. */
  short: string;
  /** What this module reads. Written as coverage, not as a finding. */
  does: string;
}

export const MODULES: readonly Module[] = [
  {
    id: "M01",
    name: "Key-person dependency",
    short: "Key-person",
    does: "We find the systems that depend on a handful of engineers, including people who have already left the company.",
  },
  {
    id: "M02",
    name: "Security & vulnerability posture",
    short: "Security",
    does: "We measure dependency exposure and how quickly patches land, then check how secrets are handled and which controls the pipeline enforces.",
  },
  {
    id: "M03",
    name: "Scalability & cloud architecture",
    short: "Scalability",
    does: "We map the services and how data moves between them, then assess how the design would cope with ten times the load.",
  },
  {
    id: "M04",
    name: "Engineering organisation health",
    short: "Eng. health",
    does: "We judge delivery pace and engineering discipline from the repository history, which shows how the team really reviews and tests its work.",
  },
  {
    id: "M05",
    name: "Compliance & regulatory posture",
    short: "Compliance",
    does: "We separate obligations enforced in code from those that exist only in policy documents, and flag what must be verified outside the codebase.",
  },
  {
    id: "M06",
    name: "IP & licensing risk",
    short: "Licensing",
    does: "We check every dependency licence against how the product is distributed, and identify what carries through the transaction.",
  },
  {
    id: "M07",
    name: "Technology modernisation risk",
    short: "Modernisation",
    does: "We compare runtime, framework and platform versions with their end-of-support dates and list the upgrades that are already overdue.",
  },
  {
    id: "M08",
    name: "AI & ML readiness",
    short: "AI & ML",
    does: "We judge whether AI is central to the product or added on later, looking at provider dependence, evaluation practice and the underlying data.",
  },
  {
    id: "M09",
    name: "Integration compatibility",
    short: "Integration",
    does: "We map the interfaces the product exposes and relies on, and estimate the true cost of integrating it with an acquirer's systems.",
  },
  {
    id: "M10",
    name: "FinOps & cloud cost efficiency",
    short: "FinOps",
    does: "We trace infrastructure spend back to the design decisions behind it and check whether cost controls exist in the code.",
  },
  {
    id: "M11",
    name: "Technical debt",
    short: "Tech debt",
    does: "We quantify the deferred work in the codebase and convert it into the engineering months needed to clear it.",
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
