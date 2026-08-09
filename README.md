# exira.ai

Marketing site for Exira — automated technical due diligence.

Two pages, no framework. Vanilla JS modules, plain CSS with custom properties,
Vite for dev server and bundling.

---

## Getting started

Requires Node 20+ (see `.nvmrc`).

```bash
npm install
npm run dev       # http://localhost:5173
```

| Script            | Does                                        |
| ----------------- | ------------------------------------------- |
| `npm run dev`     | Dev server with hot reload                  |
| `npm run build`   | Static build to `dist/`                     |
| `npm run preview` | Serve the built output locally              |

Deploy: any static host. Build command `npm run build`, output directory `dist`.

---

## Layout

```
index.html              Home
thesis.html             Long-form thesis
src/
  js/
    main.js             Home entry
    thesis.js           Thesis entry
    data.js             MODULES — the eleven modules and their findings
    nav.js              Header + mobile drawer (shared, guarded)
    reveal.js           One-shot scroll reveals
    modules.js          Section 03 module matrix
    pinned.js           Section 02 scroll-pinned sequence
    instrument.js       Hero canvas — the mark, exploded
  styles/
    main.css            Entry; imports the rest in order
    tokens.css          Colour, type, spacing custom properties
    base.css            Reset, type scale, buttons
    hero.css            Hero + instrument panel
    sections.css        Sections 01–05, CTA, footer
    responsive.css      All breakpoints, loaded last
    thesis.css          Thesis page only
  partials/
    sprite.html         Inlined brand mark (see below)
public/
  favicon.svg
  brand/                Original logo SVGs, unmodified
docs/
  website-spec.md       Design and copy rationale
```

## Things worth knowing before you edit

**The brand mark is inlined, not linked.** `src/partials/sprite.html` holds the
exact paths from the supplied SVGs and is injected into both pages by a small
plugin in `vite.config.js` at the `<!--#include sprite-->` marker. One source of
truth, and the logo paints on the first frame with no request. Reference it with
`<svg><use href="#sym-lockup"/></svg>` or `#sym-icon`.

**Mono means machine-verified.** IBM Plex Mono is reserved for evidence —
counts, module IDs, findings, dispositions, spec keys. Instrument Sans carries
human argument: headlines, lede, body. Keeping that line is what makes the data
read as measured rather than marketed.

**The hero canvas uses the real logo geometry.** `instrument.js` draws the mark's
silhouette from its actual path data (`A = 0.0278`, `B = 0.9722`, half-width to
half-height `231:100`). Changing those constants stops it being the logo.

**Section 02 is scroll-pinned.** `pinned.js` sizes a tall track, sticks the
stage, and advances four frames with scroll before releasing. Below 900px, or
under `prefers-reduced-motion`, it unpins and stacks all four. Track height is
`N * 78 + 100` vh — shorten by cutting a frame, not by shrinking the track, or
the stepping gets twitchy.

**Findings are real.** `data.js` holds output from an actual eleven-module pass
on a public production codebase. The company is deliberately not named anywhere
in the UI — keep it that way unless you have their written blessing.

**Fonts load from Google Fonts.** For a fully self-contained build, install
`@fontsource/instrument-sans` and `@fontsource/ibm-plex-mono` and import them in
`main.css` instead of the `<link>` tags.

## Before launch

- [ ] Swap the `mailto:` CTA for a Cal.com link (20-minute slots), pre-filled
      with *"Is there a live deal you'd like us to look at?"*
- [ ] Add an OG image — a still of the hero instrument mid-pass
- [ ] Add analytics (Plausible or Fathom), tracking one event: `book_demo_click`
- [ ] Decide on the fine-tune claim — see `docs/website-spec.md` §9
