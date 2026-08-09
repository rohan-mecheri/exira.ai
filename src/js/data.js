/* Assessment content.
   Findings come from a real eleven-module pass on a public production
   codebase. The target is deliberately not named anywhere in the UI. */

export const MODULES=[
 {id:"M01",n:"Key-person dependency",s:"",p:"Low concern",short:"KEY-PERSON",
  f:"Healthy distribution · departures all pre-2025 · one contributor at 5.6%",
  t:"Healthy distribution · departures pre-2025 · one contributor at 5.6%"},
 {id:"M02",n:"Security & vulnerability posture",s:"",p:"Low concern",short:"SECURITY",
  f:"Patch latency 1–6 days vs 30–90 norm · 42 custom rules · CodeQL disabled",
  t:"Patch latency 1–6 days vs 30–90 norm · 42 custom rules · CodeQL disabled"},
 {id:"M03",n:"Scalability & cloud architecture",s:"",p:"Low concern",short:"SCALABILITY",
  f:"51 Rust service crates · workload-classified analytics · 2 migrations in flight",
  t:"51 service crates · workload-classified analytics · 2 migrations in flight"},
 {id:"M04",n:"Engineering organisation health",s:"",p:"Low concern",short:"ENG HEALTH",
  f:"6× velocity growth (4–5× net of bots) · no coverage floor · 486 skipped tests",
  t:"6× velocity growth · no coverage floor set · 486 skipped tests"},
 {id:"M05",n:"Compliance & regulatory posture",s:"",p:"Low concern",short:"COMPLIANCE",
  f:"GDPR complete · HIPAA enforced in CI · SOC 2 Type II to verify out-of-band",
  t:"GDPR complete · HIPAA enforced in CI · SOC 2 Type II to verify"},
 {id:"M06",n:"IP & licensing risk",s:"",p:"Low concern",short:"LICENSING",
  f:"Three-tier structure, machine-enforced · no AGPL/SSPL — confirmed absence",
  t:"Machine-enforced licence boundary · no AGPL/SSPL — confirmed absence"},
 {id:"M07",n:"Technology modernisation risk",s:"",p:"Low concern",short:"MODERNISATION",
  f:"Every component current · earliest EOL 2028 · Python 3.13 prep underway",
  t:"Every component current · earliest EOL 2028 · 3.13 prep underway"},
 {id:"M08",n:"AI & ML readiness",s:"pos",p:"Positive signal",short:"AI & ML",
  f:"Multi-provider gateway · shipped AI-observability product · evals in CI",
  t:"Multi-provider gateway · shipped observability product · evals in CI"},
 {id:"M09",n:"Integration compatibility",s:"pos",p:"Positive signal",short:"INTEGRATION",
  f:"154 inbound connectors — ETL-vendor tier · production MCP server",
  t:"154 inbound connectors — ETL-vendor tier · production MCP server"},
 {id:"M10",n:"FinOps & cloud cost efficiency",s:"watch",p:"Verify",short:"FINOPS",
  f:"Controls present in code · live spend requires billing API access",
  t:"Controls present in code · live spend requires billing access"},
 {id:"M11",n:"Technical debt",s:"watch",p:"Manageable",short:"TECH DEBT",
  f:"~70% of Python API untyped — bounded, 3–6 months · 3 concurrent migrations",
  t:"~70% of API untyped — bounded, 3–6 months · 3 concurrent migrations"}
];

const RECORD=[
 ["09:14:02","authorisation issued","4 repositories · read-only"],
 ["09:14:03","enclave provisioned","digest a91f…3c07 · attested",""],
 ["09:14:07","repository cloned","direct from provider over TLS"],
 ["09:14:09","credentials erased","post-checkout"],
 ["09:41:55","analysis complete","11 modules · 46 findings"],
 ["09:41:57","report sealed","sha256 7e2b…9d14","seal"],
 ["09:42:01","enclave destroyed","storage keys discarded","destroy"]
];
