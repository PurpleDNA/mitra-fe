# AGENTS.md — mitra-fe

Mitra's **customer-facing frontend**: the landing page today, the client app next.
The engine (kernel, vaults, settlement, the `forge/` control plane) lives in the
sibling repo `../mitra`. This repo talks *about* the engine and, later, *to* it;
it never reimplements it.

## Ground rules

- **The page may not claim more than the engine has demonstrated.** Every product
  claim must be backed by `../mitra/forge/PROOF_LEDGER.md` or the code. Today that
  means: everything live is on **test networks** (Base Sepolia, Tempo Moderato,
  Solana devnet). No mainnet, customer, investor-logo, metric or testimonial claims.
  The live network line is `site.networkStatus` in `lib/site.ts`.
- **No invented numbers.** The only figures on the page come from worked examples
  ($100 / $70 → $30; 4 payments → 1). The 40–70% / 90%+ figures in
  `../mitra/docs/MITRA_NARRATIVE_FOR_PURPLE.md` are unmeasured and stay off the page.
- **Red means "stopped" and nothing else.** One accent (`--accent`, electric blue).
- **Light theme only**, by decision.

## Design source of truth

The approved look board on Claude Design:
https://claude.ai/artifact/HPVbksCjwbkKtmQ5vctFp2 — and its brief,
`../mitra/Mitra inspo/LOOK_BOARD_PROMPT.md`. Positioning: Mitra is a clearinghouse
(think DTCC / NIBSS), not an agent wallet. Headline: **"Agents trade. Mitra clears."**

## Layout

```
app/
  layout.tsx            fonts (Geist, Geist Mono), metadata
  globals.css           tokens, buttons, figure kit (.fig-*), brackets, motion gating
  (marketing)/page.tsx  the landing page, section by section
  icon.svg
components/
  InView.tsx            sets data-inview so a section animates only on screen
  landing/<Section>.tsx + <section>.css   one file pair per section
lib/site.ts             facts the page states about itself
```

The client app will go in its own route group, `app/(app)/…`, beside `(marketing)`.

## Conventions

- Each section owns one plain CSS file with a short class prefix (`hero-`, `pb-`,
  `fn-`, `chk-`, `cf-`, `cl-`). Shared isometric figure classes are `.fig-*` in
  `globals.css`.
- **Every animated element's resting style is its finished state.** Reduced motion
  (`prefers-reduced-motion`) turns animations off globally and must leave a
  complete, readable page.
- `InView` pauses a section's CSS animations off screen. Before hydration the
  attribute is absent and everything runs, so the page works without JavaScript.
- Diagrams are single SVGs with a `viewBox`, so they scale. On phones the two wide
  diagrams scroll sideways inside their own box (`.chk-scroll`, `.cf-scroll`).
- `ClearFirst`'s pieces all run on one 16s clock: A (without Mitra) fades out at
  48–50%, B (with Mitra) fades in at 50–52%. Keep new pieces on that clock.

## Two Chromium quirks already paid for (see `functions.css`)

1. Chromium does not re-match a `[pathLength]` descendant selector when an ancestor's
   class changes. Select drawable shapes by element type instead.
2. A `stroke-dashoffset` *transition* did not start there either; draw-on uses an
   *animation* keyed off the `.on` class.

## Commands

```bash
npm install
npm run dev        # http://localhost:3000
npm run typecheck
npm run build && npm start
```

## Open

- `site.earlyAccessHref` points at the page's own closing section; no form or inbox
  exists yet.
- The three-checks and clear-first diagrams have no phone-specific (vertical) layout.
- Nav links are in-page anchors only; there are no Docs or Developers pages yet.
