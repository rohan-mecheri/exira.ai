# Exira — Marketing Site Specification

**Version** 2.0 · 9 August 2026
**Ships with** `exira-site.html` — the complete working page, reviewed across 20+ rendered screenshots at desktop and mobile

---

## 1. The page's one job

Get a deal professional to book a demo. Nothing else earns space.

**Audience, in order:** lower mid-market PE deal partners and VPs running 5–15 software deals a year; operating partners who own sell-side readiness across a portfolio; private credit underwriters; founders 6–12 months from a process.

They are skeptical, time-poor, and have been pitched by four AI companies this month. They can smell a template.

**One CTA — Book demo** — in the nav, the hero, and the close. The hero's secondary is a quiet text link to the sample assessment, deliberately styled *down* to a plain link rather than a second button so it never competes.

---

## 2. Structure

The section order is the argument. Sections 02 and 04 are built from your technical specification rather than the deck — they are the two places a technical buyer decides whether this is real.

| # | Section | Job |
|---|---|---|
| — | **Hero** | Sparse claim + the live instrument |
| 01 | **The gap** | The problem, stated once, at size |
| 02 | **How a pass runs** | Seven stages, each with its real artifact |
| 03 | **Coverage** | Eleven modules, each with a real finding |
| 04 | **The deliverable** | What actually lands in the data room |
| 05 | **Security** | The objection that has cost you meetings |
| 06 | **Where it fits** | Screening → exclusivity → hold → exit |
| — | **Close** | Book demo |

**Cut from v1:** the competitor comparison table (weakest section, dated instantly), the buy-side/sell-side toggle (the four-moment timeline covers both sides without asking the reader to operate a switch), and the three-card "stakes" grid (now an editorial spread).

---

## 3. Hero

Sixty words in v1, twenty in v2. Calibration point: Linear's live homepage hero runs to roughly ten words — <cite index="7-1">purpose-built for planning and building products, designed for the AI era</cite>.

> **The codebase is the asset.**
> **Read it like one.**
>
> Eleven modules against the target's entire repository. Investor-grade findings in hours.

Two sentences. The first reframes: in a software deal the code *is* the asset, so treat it with the rigour already applied to financials. The second is the instruction. It works buy-side and sell-side, which the alternatives ("before you sign") did not.

*"Every software deal is priced on a codebase nobody read"* moved to section 01, where it functions as a stated problem rather than a claim about the product. It lands harder there, and it let the hero get short.

---

## 4. The signature element

> **The mark, exploded and scanned.**

The logo isn't decoration here — it's the diagram. Your icon's own layer IDs are `layer-bottom` (a *dotted evidence layer*), two grey *analytical* layers, and a top blue gradient layer. That is the product: evidence at the base, analysis between, conclusion on top.

**What it is.** Thirteen planes on a faint blueprint grid, drawn with your exact silhouette — the rounded-tip geometry taken directly from your path data (`A = 0.0278`, `B = 0.9722`, half-width:half-height `231:100`). The base plane carries your real dot pattern; the top plane carries your five-stop gradient. Between them, eleven grey analytical planes, one per module.

**What happens.**

1. Commit dots rise from below and dissolve into the evidence plane
2. A pass **rises** — evidence → eleven modules → report, ~680ms per plane. That direction is the actual pipeline, not an aesthetic choice
3. A rail down the left reads `EVIDENCE · M01…M11 · REPORT`, illuminating as the pass reaches each
4. Each module surfaces a **finding card** — real module ID, real one-line finding from the PostHog assessment — connected by a dashed annotation leader. Cards stack, dim as they age, cap at four
5. The top plane resolves into full gradient: the report
6. A readout counts modules resolved, findings raised, lines read, and — the point — **`0 bytes retained`**

Full cycle ~10.8s.

**Why not the converging globe you liked.** That metaphor is about aggregation from many places. Exira's story is the opposite: depth in one place. Stratigraphy, not geography. And because the cards carry real findings, the first thing a partner sees is product output, not a marketing abstraction.

**Implementation.** One `<canvas>` for planes, particles, rail and leaders; finding cards are real DOM so type stays crisp and screen-readable. Leader endpoints read the live card `getBoundingClientRect()`, so routing stays correct at any width. Paused via `IntersectionObserver` when off-screen. ~200 lines of vanilla JS, no libraries.

**Second set piece.** The sealed-enclave diagram in section 05: SMIL-animated packets, an explicitly crossed inbound arrow labelled *no inbound path*, and a boundary table listing what leaves the enclave against what never does.

---

## 5. Design system

### Colour

Cool pale ground, not cream. Every value derives from your logo gradient and the navy in your deck.

| Token | Hex | Use |
|---|---|---|
| `--paper` | `#EFF2F7` | Page ground |
| `--paper-2` | `#E6EBF3` | Alternating bands |
| `--surface` | `#FFFFFF` | Cards, tables, the report preview |
| `--ink` | `#001448` | Headlines — your wordmark's own fill |
| `--muted` | `#5D7092` | Body |
| `--line` | `#D8DFEA` | Hairlines |
| `--b900 / b500 / b300` | `#06307C` / `#234D9E` / `#6F92D7` | The gradient, used sparingly |
| `--pos` / `--watch` | `#146A3C` / `#8A5A0A` | Dispositions only |

One section inverts, to `#06307C` — your brand navy, not black. Security is where the register shifts from "here's what you get" to "here's why you can trust us with the crown jewels," and the colour does that without a word. Note your logo carries no dark-ground variant (the "white" files are the transparent ones plus a white rect), so the mark never appears on that section.

### Type

**Instrument Sans** and **IBM Plex Mono**. Not Inter — Inter is the tell. The pairing carries a rule:

> **Mono is reserved for machine-verified evidence** — counts, module IDs, findings, dispositions, artifact keys. **Sans carries human argument** — headlines, lede, body.

Deterministic facts render one way, interpretation another. That's the product as a type system, and it gives every number an instrument-panel quality without a chart anywhere on the page.

`text-wrap: balance` on headlines, `pretty` on lede — both fix hyphen-breaks the screenshots caught.

### Structure

Max width 1320px, fluid gutters. Radius 3–5px maximum. Card grids use `gap:1px` on a `--line` ground so neighbours share a hairline rather than floating — the page reads as a document, not a dashboard. Two shadows on the whole page, both near-invisible.

### Motion

Every animation encodes something true; slow and eased (`cubic-bezier(.22,.61,.36,1)`, 200–800ms); reveals are 14px + fade, once. No parallax, no scroll-jacking, no springs. `prefers-reduced-motion` renders a fully-formed static state — all planes resolved, four findings visible, SVG paused — not a degraded one.

---

## 6. Deliberately absent

The anti-slop list. Each is something a generated page reaches for by default:

emoji · sparkle icons · "AI-powered" badges · purple or violet-to-pink gradients · aurora blobs · glassmorphism · fake "Trusted by" logo bars · invented testimonials · a generic three-column feature grid with line icons · counter animations · typewriter text · a chatbot bubble · pricing · an empty blog · Anthropic's `#D97757` terracotta · the cream-and-serif look.

Copy never uses *revolutionary*, *seamless*, *unlock*, or *leverage* as a verb. It was written to survive being read aloud in an IC meeting.

---

## 7. Review log

Every fix below came from reading a rendered screenshot, not from reasoning about the code:

- Nav CTA text was invisible — `.nav-links a` outranked `.btn` on specificity
- H1 carried a phantom indent from a whitespace text node
- The statement grid didn't collapse on mobile; the report table didn't stack
- Enclave labels overflowed their dashed box; the diagram was rendering at ~7px
- The callout leader pointed at cards mid-fade, then at the register's flex box rather than the card itself
- **A 403 revealed the webfonts were never loading** — the first eight review passes were done in Helvetica. Fonts were pulled from npm and every judgement re-made
- Security's right column and the process artifact panel both ran short against their neighbours; a boundary table and a taller artifact panel fixed the balance

---

## 8. Build notes

**Shipping form.** One static HTML file. No framework, no build step. Deploys to Vercel, Netlify or Cloudflare Pages as-is.

Two copies are included: `exira-site.html` has the fonts embedded so it renders identically anywhere, including offline; `exira-site-cdn-fonts.html` loads them from Google Fonts, which is what you'd actually deploy (~190KB lighter). Otherwise identical.

**Targets.** LCP < 1.2s, CLS 0, JS ~9KB. Canvas capped at DPR 2 and paused off-screen. No horizontal scroll at any width tested.

**Accessibility.** Visible focus rings, `aria-selected` on both listboxes, `aria-live` on the module panel, `role="img"` with a full descriptive label on the hero canvas, keyboard traversal throughout, correct `aria-expanded` on the mobile drawer.

**Before launch.** Swap the `mailto:` to a Cal.com link with 20-minute slots — matching the twenty minutes you ask for in outreach — and pre-fill the question *"Is there a live deal you'd like us to look at?"* That's the qualifier that makes the meeting worth taking on both sides. Add Plausible or Fathom tracking exactly one event, `book_demo_click`, plus scroll depth to Security. The OG image should be a still of the instrument mid-pass with one finding card visible; it's the most distinctive asset you own.

---

## 9. Decisions that need your signature

1. **Competitors are unnamed.** Section 06 compares *models* — consulting economics against this — not companies. Naming Vaultinum and CodeWeTrust on a public page invites a response and dates instantly.
2. **No fine-tune claim anywhere.** The page sells the proprietary *workflow*: deterministic collection, eleven parallel modules, cross-module reconciliation, an independent critic pass, an evidence contract on every finding. Your spec v0.1 describes a model-agnostic router with no fine-tune in it, and a technical buyer will test that claim in the demo. This is the most consequential copy decision on the page and it should be yours.
3. **"EU-hosted" appears nowhere.** Your spec has Confidential Space as *Preferred*, not *Locked*. The security section claims attestation, single tenancy, non-retention and verifiable destruction — all architectural, all defensible. Residency is one line to add once it's contractually true.
4. **No logos, testimonials, or team page.** Pre-revenue with a real demo and no social proof reads honest. Pre-revenue with vague social proof reads fake. When you have two named design partners they go directly beneath the hero.
5. **PostHog is named.** Their code is public and the assessment is code-level, so this is defensible — but tell them, and consider asking for their blessing to cite it. PostHog is unusually likely to say yes, and a line from them would be worth more than any logo bar.

---

## 10. Next passes

- **v2.1** — Cal.com embed; OG image; a design-partner logo if secured
- **v2.2** — `/assessment`: the full PostHog report as a readable web document behind an email gate. It's your best sales asset and right now it's a PDF attachment; as a live page it circulates inside a firm, which is how deal teams actually share things
- **v2.3** — a dedicated **private credit** page. Your own research calls it the most structurally underserved segment with virtually no automated competition, and technical covenant monitoring is a different headline from acquisition diligence
