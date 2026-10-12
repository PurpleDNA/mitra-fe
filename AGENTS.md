# AGENTS.md — mitra-fe

Mitra's **customer-facing frontend**: the landing page, the developer portal (`/docs`) and
the customer app (`/app`).
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

The logo ("Bound", approved 2026-10-11): https://claude.ai/artifact/Jpw5VHLrcHGAa8otoLL5GQ.
Corner brackets (the mandate), a pale vault diamond (`--accent-tint`) and a blue core
(`--accent`), on a 48-unit grid. Only the core is ever blue, and red never appears in it.
Below 24px use the compact mark (no vault).

## Layout

```
app/
  layout.tsx            fonts (Geist, Geist Mono), metadata
  globals.css           tokens, buttons, figure kit (.fig-*), brackets, motion gating
  (marketing)/page.tsx  the landing page, section by section
  icon.svg              favicon: the compact mark, brackets turn white in dark mode
  apple-icon.png        180px touch icon
  opengraph-image.png   link preview (1200×630) + opengraph-image.alt.txt
components/
  Mark.tsx              the logo mark, inline SVG coloured by the site tokens
  InView.tsx            sets data-inview so a section animates only on screen
  landing/<Section>.tsx + <section>.css   one file pair per section
lib/site.ts             facts the page states about itself
public/brand/           logo source files: mark (primary, compact, display, reverse, on-accent),
                        lockups (horizontal, stacked, reverse, on-accent), bracketed wordmark.
                        The wordmark is Geist SemiBold outlined, tracking −4.5%.
  brand/mitra-logo-pack/ + .zip   the logo pack for handing out, GENERATED from the primary
                        SVGs above by `node scripts/brand-pack.mjs`. Never edit it by hand.
app/docs/               the developer portal: shell layout, home, [slug] pages
lib/docs/nav.ts         portal structure: sections, pages, reader tracks
lib/docs/render.tsx     markdown → React: GFM, KaTeX, Shiki, code tabs, link rewriting
content/docs/           the portal's pages, COPIED from ../mitra by `npm run docs:sync`
app/llms.txt/route.ts   serves content/llms.txt
```

## The developer portal

**The words belong to the engine repo.** `../mitra/docs/portal/NN-*.md` and
`../mitra/docs/llms.txt` are the source; `npm run docs:sync` copies them into
`content/` (with the engine commit in `content/docs/SOURCE.json`) and the site builds from
the copy. Fix a page there, sync, commit here. Never edit `content/docs/` by hand.

The pages were checked against the code on 2026-10-11 and much did not hold (engine
`forge/FAILURES.md` F105, `docs/portal/CLAIMS_CHECK.md`). Until F105 is closed every
portal page carries `site.docsDraftNotice`; set it to `null` when it is.

Rendering rules: consecutive `### TypeScript` / `### Python` (or REST, Bash…) sections with
one code block each become a language tab group, and the chosen language is remembered
across pages. `$` before a digit is a price, not maths. Pictograph emoji are dropped from
prose (not from code blocks, where the ASCII diagrams depend on their width). Links to
sibling pages become `/docs/<slug>`; other relative links point at the engine repo on GitHub.

## The customer app (`/app`)

For the people behind the agents: they fund a vault, give agents limits, watch payments,
step in, and see what cleared. Agents never use it; they use the SDK, API or MCP.
Design source: https://claude.ai/artifact/9efHw75qjq2doHTetg6zWN.

- **Two doors in front of `/app`** (`proxy.ts`, in order):
  1. **Early access.** Without the access cookie, `/app` sends you to `/access`, which takes a
     shared code (`MITRA_EARLY_ACCESS_CODE`, set in Vercel for production and preview, and in
     `.env.local`). The cookie holds a keyed hash of the code, so changing the code locks
     everyone out. Unset, the gate admits nobody.
  2. **An account.** Without a Supabase session, `/app` sends you to `/signin`: Google,
     wallet (Sign in with Ethereum) or an email link. `/auth/callback` trades the
     one-time code for a session (GitHub is off, by decision); `/auth/signout` is POST only. The proxy refreshes the
     session cookie on every matched request (`lib/supabase/proxy.ts`).
  Someone already through a door is never shown it again.
- **Accounts live in Supabase**, project `mitra` (ref `tjlnxnirtltczjruymnl`, eu-west-2,
  free tier, org "TYSIN Org"). Clients in `lib/supabase/`. Env: `NEXT_PUBLIC_SUPABASE_URL`,
  `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (public by design; set in Vercel and `.env.local`).
  No service-role key is used anywhere in this app.
- **Table `agents`** holds what the chain doesn't: which agents belong to the account (per
  chain and vault owner), their names and capabilities. Row-level security: an account
  reads and writes only its own rows. Agents saved in the browser before accounts are
  imported into the account on first load, then cleared from the browser.
- Sign-in methods are switched on in the Supabase dashboard (Authentication → Providers),
  and each site address must be allowed under Authentication → URL Configuration. A
  method that is off fails with a plain message on `/signin`, never silently.
- Routes are `/app/<workspace>/…`. `/app` sends a new arrival to `/app/new`.
- **Two workspaces today, and why.** The engine has no customer accounts (no
  organisations, sign-in or per-customer keys), so the app cannot know who a user is.
  `new` is the **live workspace**: the person connects a wallet (RainbowKit + wagmi,
  `components/app/WalletProviders.tsx`) and that wallet is their vault's principal. `acme`
  is demo data (`lib/app/demo.ts`), labelled "Demo data" on every page.
- **The live workspace is on chain, from the user's wallet** (`components/app/live/`,
  `lib/chain/`), on two test networks. `NETWORKS` in `lib/chain/config.ts` is the table:
  Base Sepolia (vault `0x92dcee6a…e489`, Circle test USDC) and Tempo Moderato (vault
  `0x85409dfc…b568`, PathUSD), both copied from `../mitra/lib/evm/deployments.json` and
  read back from the chain. The app follows the network the wallet is on (`useNet()`);
  the top bar has a network menu, and nothing forces a switch on connect.
  - Tempo is declared with an 18-decimal native currency because MetaMask refuses
    anything else; Tempo has no gas coin and fees come out of the stablecoin. Plain
    EIP-1559 transactions with default fees work there (checked 2026-10-12).
  - Test money: Base links to Circle's faucet; Tempo calls the network's own
    `tempo_fundAddress` from a button, then re-reads the balance from the chain.
  - Agents in the account are scoped by chain, so each network has its own list.
  - Vault: `deposit` / `withdraw`. Positions are read from `vaults(principal, token)`.
  - Agents: the agent's wallet address and a name. The contract has no holder list, so
    the list lives in the account (`agents` table); everything else is read from
    `mandates(principal, holder, token)`.
  - Limits: `openMandate` / `amendMandate` / `revokeMandate`, naming the engine's policy
    key (`POLICY_ENGINE` in `lib/chain/config.ts`, overridable with
    `NEXT_PUBLIC_MITRA_POLICY_ENGINE`). Expired or revoked limits cannot be reopened for
    the same wallet (the contract refuses `MANDATE_ALREADY_EXISTS`), and the screen says so.
  - "Pause all" is `setEmergencyFreeze` on the user's vault position.
  - Each agent is a **spend card** (`components/app/live/AgentCard.tsx`): headroom, cap,
    end date, version, capabilities, and four panels: limits, capabilities, Try it, Connect.
  - **Capabilities are engine policy, not vault state.** Preset chips plus typed tags, saved
    with the agent in the account; they fill the engine-mandate snippet in Connect.
    Empty means the engine's default (`payment`, `research`).
  - **Try it is a dry run** (`lib/chain/dryrun.ts`): it evaluates a pretend request against
    the agent's real on-chain limits and vault, with the exact codes the vault contract and
    engine use. It signs and sends nothing, says so on screen, and never shows the third
    check (exact match) as passed, because only a real signed payment reaches it. Never
    animate a dry run into "settled".
  - "Change limits" (`amendMandate`) bumps the version but does **not** cancel permits
    already issued: the contract accepts any version up to the current one. Only Revoke
    does. The form says so; keep it that way.
  - Contract refusals are shown in plain English (`PLAIN` in `lib/chain/hooks.ts`) with the
    raw code in an "Audit details" drawer.
  - Only a receipt with status `success` is shown as confirmed; failures show the revert reason.
- Agents spend nothing yet. **Known gap: the engine does not yet pay from a vault opened here.** Its vault rail
  (`../mitra/lib/settlement/rails.ts`) pays from the principal it was started with (its
  own key). Until that is configurable, step 5 ("let it work") cannot complete for a
  user's vault, and the Developers page says so.
- **Generate an agent wallet** (register form) makes a key in the browser with viem, shows it
  once with a copy button, and keeps Register disabled until the person ticks that they saved
  it. The key is never stored or sent. Test networks only, and the screen says so.
- Env: see `.env.example`. `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` is read in one place,
  `WALLETCONNECT_PROJECT_ID` in `lib/chain/config.ts` (optional; without it only browser-extension
  wallets and Coinbase Wallet are offered), `NEXT_PUBLIC_RPC_URL` (optional; point reads at
  another node, e.g. an anvil fork of Base Sepolia for testing).
- **Testing on Tempo** needs no fork: Moderato's faucet is free and programmatic.
- **Testing the flow without spending testnet funds (Base):** `anvil --fork-url
  https://sepolia.base.org --chain-id 84532`, give an anvil account test USDC by writing
  its balance (FiatToken balance mapping, slot 9), run `next dev` with
  `NEXT_PUBLIC_RPC_URL=http://127.0.0.1:8545`, and use a wallet pointed at the fork.
- `next.config.ts` aliases five optional `@x402/*` imports to `lib/chain/x402-unused.ts`:
  wagmi's Base Account connector pulls in `@coinbase/cdp-sdk`, whose lazy x402 helpers
  import packages that are not installed. The app never calls them.
- **One data seam for the demo:** screens read `lib/app/workspaces.ts` and the types in
  `lib/app/types.ts`; the live workspace reads the chain through `lib/chain/hooks.ts`.
- **Actions are honest.** In the demo, `DemoAction` buttons do nothing and say so. In the
  live workspace every action is a real transaction; nothing may claim a payment, refund
  or pause happened without a successful receipt.
- **The setup snippets are the engine's real interface**, checked against `../mitra`
  (`lib/sdk/client.ts`, `app/api/v1/mandates/route.ts`, `scripts/mitra-mcp.ts`). Re-check
  them when the engine changes.
- Someone already let in (valid access cookie) who opens `/access` goes straight on to the app.
- The design adds a "needs you over $X" review threshold; the engine has the `REVIEW`
  decision but no such mandate field yet.

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
npm run docs:sync  # copy the portal pages from ../mitra (or $MITRA_ENGINE_DIR)
```

## Deploy

- GitHub: `PurpleDNA/mitra-fe` (private). Vercel: project `purple-inc/mitra-fe`, connected
  to the repo — every push to `main` is a production deploy; other branches get previews.
- Production: https://mitra-fe-zeta.vercel.app
- The build needs nothing from `../mitra`: the docs are the committed copy in `content/`.
  Run `npm run docs:sync` and commit before pushing if the engine's pages changed.

## Open

- **The early-access list saves nothing yet.** `/early-access` is the sign-up form every
  "Request early access" button leads to, but `lib/signups.ts` returns a stand-in store
  (`saves: false`), by decision. The form says "Preview — sign-ups aren't saved yet" and
  the confirmation tells the visitor nothing was kept. To make it real, implement
  `SignupStore` and return it from `signupStore()`; the page switches to "You're on the
  list" by itself. Never set `saves: true` on anything that does not durably store.
- The portal has no Solana/Base/Tempo code toggle: the pages carry no per-chain samples
  to toggle between, and inventing them would be the F105 failure again.
- `docs/llms.txt` was not part of the claims check and will repeat the pages' errors.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
