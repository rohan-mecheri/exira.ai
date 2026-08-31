# exira.ai

Marketing site for Exira — automated technical due diligence.

Next.js App Router, TypeScript, plain CSS with custom properties. No CSS
framework: the token system in `styles/tokens.css` is carrying the
mono-is-evidence rule, and utility classes would scatter that decision
across every element.

---

## Getting started

Requires Node 20+ (see `.nvmrc`).

```bash
npm install
npm run dev       # http://localhost:3000
```

| Script              | Does                                     |
| ------------------- | ---------------------------------------- |
| `npm run dev`       | Dev server with fast refresh             |
| `npm run build`     | Production build                         |
| `npm run start`     | Serve the production build locally       |
| `npm run typecheck` | `tsc --noEmit`                           |

Deploy: Vercel. The four pages prerender as static content, so nothing is
rendered per request; `app/api/contact/route.ts` is the one dynamic route,
and it needs `RESEND_API_KEY` and `CONTACT_FROM_EMAIL` in the environment
(see Before launch). Vercel resolves those at build time, so adding one does
not reach a deployment that already exists — redeploy after.

---

## Layout

```
app/
  layout.tsx            Nav, Footer, sprite, fonts, metadata
  page.tsx              Home
  thesis/page.tsx       Thesis
  demo/page.tsx         The contact form
  privacy/page.tsx      Privacy policy
  api/contact/route.ts  Receives a submission and mails it on
components/
  Nav.tsx               Header + mobile drawer (shared)
  Footer.tsx            Footer (shared)
  Sprite.tsx            Inlined brand mark (see below)
  Arrow.tsx             The two CTA arrows
  Hero.tsx              Hero copy + instrument
  Instrument.tsx        Hero canvas — the mark, exploded
  Gap.tsx               Section 01
  Pinned.tsx            Section 02 scroll-pinned sequence
  PipelineSchematic.tsx Section 02 schematic, lit by active stage
  ModuleMatrix.tsx      Section 03 module matrix
  Report.tsx            Section 04 report card
  WhereItFits.tsx       Section 05
  Cta.tsx               The close
  Reveals.tsx           One-shot scroll reveals
  Toc.tsx               Thesis contents rail
lib/
  modules.ts            MODULES — the eleven modules and their findings
  isolation.ts          STAGES — section 02's four stages
  segments.ts           SEGMENTS — thesis §04's seven buyers
  booking.ts            Where every Book demo points, and the contact address
  rate-limit.ts         Per-address limiter for the contact endpoint
styles/
  globals.css           Entry; imports the rest in order
  tokens.css            Colour, type, spacing custom properties
  base.css              Reset, type scale, buttons, nav
  hero.css              Hero + instrument panel
  sections.css          Sections 01–05, CTA, footer
  thesis.css            Thesis page only
  responsive.css        All breakpoints, loaded last
public/
  favicon.svg
  brand/                Original logo SVGs, unmodified
docs/
  website-spec.md       Design and copy rationale
```

## Things worth knowing before you edit

**Content lives in `lib/`, not in the markup.** `MODULES`, `STAGES` and
`SEGMENTS` are typed, and every field is required — a module without a
disposition is a build error rather than an empty pill on the page. Add a
module by adding an entry, not by copying a tile.

**The brand mark is inlined, not linked.** `components/Sprite.tsx` holds the
exact paths from the supplied SVGs and renders once in the root layout. One
source of truth, and the logo paints on the first frame with no request.
Reference it with `<svg><use href="#sym-lockup"/></svg>` or `#sym-icon`. It
is injected as a string rather than hand-converted to JSX — sixty lines of
gradient, pattern and clipPath markup is a transcription risk with nothing
to gain.

**Mono means machine-verified.** IBM Plex Mono is reserved for evidence —
counts, module IDs, findings, dispositions, spec keys. Instrument Sans
carries human argument: headlines, lede, body. Keeping that line is what
makes the data read as measured rather than marketed.

**Fonts are self-hosted via `next/font`.** No third-party request, and the
fallback is metric-matched so nothing shifts on load. The families are
exposed as `--font-sans` / `--font-mono`, which `tokens.css` folds into the
`--sans` and `--mono` stacks. `Instrument.tsx` reads the resolved `--mono`
value at runtime, because a canvas needs a concrete family string rather
than a CSS variable — that read is the one place a font rename could break
silently.

**The hero canvas uses the real logo geometry.** `Instrument.tsx` draws the
mark's silhouette from its actual path data (`A = 0.0278`, `B = 0.9722`,
half-width to half-height `231:100`). Changing those constants stops it
being the logo. It is direct canvas and `requestAnimationFrame` work inside
a `useEffect` — every listener, timer, observer and frame is torn down on
unmount, or a client-side navigation away would leave a loop painting to a
detached canvas.

**Section 02 is scroll-pinned.** `Pinned.tsx` sizes a tall track, sticks the
stage, and advances four frames with scroll before releasing. Below 900px,
or under `prefers-reduced-motion`, it unpins and stacks all four. Track
height is `N * 78 + 100` vh — shorten by cutting a stage from `STAGES`, not
by shrinking the track, or the stepping gets twitchy. Scroll position is
read imperatively; everything downstream is ordinary state, so the steps,
frames and schematic cannot drift out of sync.

**`.doc` is the report card, and only the report card.** It used to also be
the thesis body grid, kept apart only by which stylesheet loaded last. The
thesis grid is `.essay` now, and every page loads one stylesheet in one
order. If you add a page-specific rule, check the name isn't already taken.

**Findings are real.** `lib/modules.ts` holds output from an actual
eleven-module pass on a public production codebase. The company is
deliberately not named anywhere in the UI — keep it that way unless you
have their written blessing.

## Before launch

- [x] Booking: all five controls go through `components/BookDemo.tsx` to
      `/demo`, tagged with `?src=` (nav / hero / close / footer / thesis).
      The form there posts to `app/api/contact/route.ts`, which emails
      `CONTACT_EMAIL` (`lib/booking.ts`, currently `sales@exira.ai`) via
      Resend.
- [x] Mail: `exira.ai` is verified in Resend and `RESEND_API_KEY` /
      `CONTACT_FROM_EMAIL` (`Exira Website <noreply@exira.ai>`) are set
      locally and in Vercel. Without the key the form fails closed with a
      friendly error rather than silently dropping submissions, so an
      unconfigured environment is loud. Note Vercel bakes env vars in at
      build time — adding one does not reach a deployment that already
      exists, and needs a redeploy.
- [ ] `CONTACT_TO_EMAIL` overrides where submissions land, leaving
      `CONTACT_EMAIL` as the address the site prints. It is set locally to
      route notifications to a personal inbox and deliberately not set in
      Vercel, so production delivers to `sales@exira.ai`. Remove it once
      that inbox is the one being watched.
- [x] Rate limit and spam trap on `app/api/contact/route.ts`: 8 requests
      per address per hour (`lib/rate-limit.ts`), a honeypot field and an
      elapsed-time check, plus body and per-field length caps. The route's
      own comment explains the ordering.

      The two bot checks flag rather than reject. A submission they catch
      still arrives, subject-tagged `[suspect]`, because their failure
      mode is destroying a real enquiry while showing its sender "Message
      sent." A tagged mail in the wrong folder is recoverable; that is
      not. Worth a filter rule on the receiving inbox.

      The limiter is in memory, so it is per serverless instance and
      resets on a cold start — enough to stop one client hammering the
      form, not a distributed flood. The upgrade is the same `rateLimit`
      interface backed by Vercel KV or Upstash, or a Vercel Firewall rule
      in front of the route. Worth doing if the form ever attracts real
      abuse; not worth the dependency before that.
- [ ] Add an OG image — a still of the hero instrument mid-pass
- [ ] Add analytics (Plausible or Fathom), tracking one event: `book_demo_click`
- [x] Fine-tune claim: approved 10 Aug 2026. It appears under the module
      matrix and in thesis §06, phrased as models fine-tuned on completed
      assessments and the deal outcomes that followed. A technical buyer
      will test this in the demo, so the demo has to be able to show it.
- [ ] Data residency: still unclaimed anywhere. "EU-hosted" was the
      original wording but the pipeline is mostly North American, so the
      line to make once it is contractually true is residency in the
      region the client chooses, not residency in one region
- [x] Production origin confirmed: the site serves at `www.exira.ai` and
      the apex 308s to it, so `metadataBase` is the www host. Anything that
      publishes a URL — canonical, OG, Twitter — resolves against it.
