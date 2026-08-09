/* Assessment content.
   Findings come from a real eleven-module pass on a public production
   codebase. The target is deliberately not named anywhere in the UI. */

/** Drives the tile dot colour. "" is the neutral default. */
export type Signal = "" | "pos" | "watch";

/** The disposition a deal team reads off the tile. */
export type Disposition =
  | "Low concern"
  | "Positive signal"
  | "Verify"
  | "Manageable";

export interface Module {
  /** M01–M11. */
  id: string;
  /** Module name, as it appears on the tile. */
  name: string;
  signal: Signal;
  disposition: Disposition;
  /** Uppercase label for the hero canvas callout. */
  short: string;
  /** Full finding — the report line. */
  full: string;
  /** Tile finding — the same line, trimmed to fit a matrix cell. */
  tile: string;
}

export const MODULES: readonly Module[] = [
  {
    id: "M01",
    name: "Key-person dependency",
    signal: "",
    disposition: "Low concern",
    short: "KEY-PERSON",
    full: "Healthy distribution · departures all pre-2025 · one contributor at 5.6%",
    tile: "Healthy distribution · departures pre-2025 · one contributor at 5.6%",
  },
  {
    id: "M02",
    name: "Security & vulnerability posture",
    signal: "",
    disposition: "Low concern",
    short: "SECURITY",
    full: "Patch latency 1–6 days vs 30–90 norm · 42 custom rules · CodeQL disabled",
    tile: "Patch latency 1–6 days vs 30–90 norm · 42 custom rules · CodeQL disabled",
  },
  {
    id: "M03",
    name: "Scalability & cloud architecture",
    signal: "",
    disposition: "Low concern",
    short: "SCALABILITY",
    full: "51 Rust service crates · workload-classified analytics · 2 migrations in flight",
    tile: "51 service crates · workload-classified analytics · 2 migrations in flight",
  },
  {
    id: "M04",
    name: "Engineering organisation health",
    signal: "",
    disposition: "Low concern",
    short: "ENG HEALTH",
    full: "6× velocity growth (4–5× net of bots) · no coverage floor · 486 skipped tests",
    tile: "6× velocity growth · no coverage floor set · 486 skipped tests",
  },
  {
    id: "M05",
    name: "Compliance & regulatory posture",
    signal: "",
    disposition: "Low concern",
    short: "COMPLIANCE",
    full: "GDPR complete · HIPAA enforced in CI · SOC 2 Type II to verify out-of-band",
    tile: "GDPR complete · HIPAA enforced in CI · SOC 2 Type II to verify",
  },
  {
    id: "M06",
    name: "IP & licensing risk",
    signal: "",
    disposition: "Low concern",
    short: "LICENSING",
    full: "Three-tier structure, machine-enforced · no AGPL/SSPL — confirmed absence",
    tile: "Machine-enforced licence boundary · no AGPL/SSPL — confirmed absence",
  },
  {
    id: "M07",
    name: "Technology modernisation risk",
    signal: "",
    disposition: "Low concern",
    short: "MODERNISATION",
    full: "Every component current · earliest EOL 2028 · Python 3.13 prep underway",
    tile: "Every component current · earliest EOL 2028 · 3.13 prep underway",
  },
  {
    id: "M08",
    name: "AI & ML readiness",
    signal: "pos",
    disposition: "Positive signal",
    short: "AI & ML",
    full: "Multi-provider gateway · shipped AI-observability product · evals in CI",
    tile: "Multi-provider gateway · shipped observability product · evals in CI",
  },
  {
    id: "M09",
    name: "Integration compatibility",
    signal: "pos",
    disposition: "Positive signal",
    short: "INTEGRATION",
    full: "154 inbound connectors — ETL-vendor tier · production MCP server",
    tile: "154 inbound connectors — ETL-vendor tier · production MCP server",
  },
  {
    id: "M10",
    name: "FinOps & cloud cost efficiency",
    signal: "watch",
    disposition: "Verify",
    short: "FINOPS",
    full: "Controls present in code · live spend requires billing API access",
    tile: "Controls present in code · live spend requires billing access",
  },
  {
    id: "M11",
    name: "Technical debt",
    signal: "watch",
    disposition: "Manageable",
    short: "TECH DEBT",
    full: "~70% of Python API untyped — bounded, 3–6 months · 3 concurrent migrations",
    tile: "~70% of API untyped — bounded, 3–6 months · 3 concurrent migrations",
  },
];

/** Assessment totals, shown as the twelfth cell of the matrix. */
export const ASSESSMENT_TOTALS: readonly { value: string; label: string }[] = [
  { value: "46", label: "findings raised" },
  { value: "3", label: "cross-module risks" },
  { value: "2", label: "to verify out-of-band" },
  { value: "0", label: "deal-blocking" },
];

export interface LifecycleEvent {
  at: string;
  event: string;
  detail: string;
}

/** Signed lifecycle record from the same pass. Not yet rendered — this is
    the spine of the /assessment page. */
export const LIFECYCLE_RECORD: readonly LifecycleEvent[] = [
  { at: "09:14:02", event: "authorisation issued", detail: "4 repositories · read-only" },
  { at: "09:14:03", event: "enclave provisioned", detail: "digest a91f…3c07 · attested" },
  { at: "09:14:07", event: "repository cloned", detail: "direct from provider over TLS" },
  { at: "09:14:09", event: "credentials erased", detail: "post-checkout" },
  { at: "09:41:55", event: "analysis complete", detail: "11 modules · 46 findings" },
  { at: "09:41:57", event: "report sealed", detail: "sha256 7e2b…9d14" },
  { at: "09:42:01", event: "enclave destroyed", detail: "storage keys discarded" },
];
