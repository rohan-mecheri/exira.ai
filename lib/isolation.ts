/* Section 02 — the four stages of a pass, and which parts of the
   schematic each one lights up. */

/** Node and flow ids in the pipeline schematic. */
export type SchemaId =
  | "n-target"
  | "n-broker"
  | "n-enclave"
  | "n-out"
  | "n-exira"
  | "f-auth"
  | "f-mint"
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
  /** 01–04, as printed. */
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
    body: "Our CI pipeline builds the analysis engine — orchestration, deterministic scanners, policies, output filters — into a private OCI image. It is vulnerability-scanned, cryptographically signed and assigned an immutable digest. The confidential runner launches that digest and nothing else. Before granting any access, the target validates attestation evidence binding the environment's ephemeral key to the approved workload measurement.",
    spec: [
      { key: "image", value: "signed OCI · immutable digest · private registry" },
      { key: "launch", value: "digest-pinned · no debug build · no build tooling" },
      { key: "interfaces", value: "no SSH · no console · no inbound admin path", tone: "w" },
      { key: "proof", value: "remote attestation, verified target-side", tone: "g" },
    ],
    hot: ["n-enclave"],
  },
  {
    n: "02",
    step: "Scoped authorisation",
    heading: "The credential is minted where we cannot hold it.",
    body: "The target selects repositories and issues a one-time, read-only grant. Minting happens inside an attested credential broker, constrained by repository, job and time. The ordinary Exira control plane relays opaque ciphertext and never receives a usable token — a conventional integration whose private key sits on our backend would not satisfy this. The credential is erased immediately after checkout.",
    spec: [
      { key: "grant", value: "one-time · read-only · repository-scoped" },
      { key: "minted in", value: "attested broker · job and time bound" },
      { key: "control plane", value: "opaque ciphertext only · never a usable token", tone: "w" },
      { key: "lifetime", value: "erased post-checkout" },
      { key: "revocation", value: "target-side, at any point", tone: "g" },
    ],
    hot: ["n-target", "n-broker", "n-enclave", "f-auth", "f-mint"],
  },
  {
    n: "03",
    step: "Sealed execution",
    heading: "The repository is treated as hostile input.",
    body: "The checkout lands on encrypted ephemeral storage inside the enclave, cloned directly from the provider over TLS — we are not a proxy and hold no copy. Target code is not executed by default; parsers and static tools operate on files as data. Repository-supplied agent instructions, plugin definitions and MCP configurations are ignored, symlinks are constrained to the worktree, and egress is restricted to an allow-list.",
    spec: [
      { key: "storage", value: "encrypted ephemeral · one tenant, one assessment" },
      { key: "execution", value: "none by default · files read as data" },
      { key: "injection", value: "repo-supplied agent config ignored", tone: "w" },
      { key: "egress", value: "allow-list only · no general network" },
      { key: "training", value: "customer code never used to train, ours or a provider's", tone: "g" },
    ],
    hot: ["n-enclave", "f-clone", "f-block"],
  },
  {
    n: "04",
    step: "Export and destruction",
    heading: "Only a schema-validated register leaves.",
    body: "Findings pass an output policy engine before release: schema enforced, secrets and source-leakage scanned, raw model sessions and native scanner output withheld. Evidence travels as file paths, line ranges and content hashes rather than unbounded excerpts. At the end of the approved window the runner, credentials and intermediate artifacts are destroyed and the target keeps a signed lifecycle record.",
    spec: [
      { key: "released", value: "findings register · report · evidence references" },
      { key: "withheld", value: "checkout · credentials · raw sessions · excerpts", tone: "w" },
      { key: "evidence", value: "path + line range + content hash" },
      { key: "destruction", value: "runner · credentials · intermediate artifacts" },
      { key: "record", value: "signed, tamper-evident, held by the target", tone: "g" },
    ],
    hot: ["n-enclave", "n-out", "n-exira", "f-out", "f-del"],
  },
];
