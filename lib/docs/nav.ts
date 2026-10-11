/**
 * The portal's structure (DEVELOPER_PORTAL_SPEC.md §3). Page files live in
 * content/docs, copied from the engine repo by `npm run docs:sync`.
 */

export type Track = "agents" | "treasury" | "integrators";

export const TRACKS: { id: Track | "all"; label: string }[] = [
  { id: "all", label: "All" },
  { id: "agents", label: "Agent developers" },
  { id: "treasury", label: "Treasury & risk" },
  { id: "integrators", label: "Protocol integrators" },
];

export interface DocPage {
  slug: string;
  file: string;
  /** Short label for the sidebar; the page's own H1 is its full title. */
  nav: string;
  section: string;
  /** Which reader tracks this page is for. Every track sees the overview pages. */
  tracks: Track[];
}

const ALL: Track[] = ["agents", "treasury", "integrators"];

export const SECTIONS: { title: string; pages: DocPage[] }[] = [
  {
    title: "Getting started",
    pages: [
      { slug: "what-is-mitra", file: "01-what-is-mitra.md", nav: "What is Mitra", section: "Getting started", tracks: ALL },
      { slug: "quickstart", file: "02-quickstart.md", nav: "Quickstart", section: "Getting started", tracks: ["agents"] },
      { slug: "multi-door-architecture", file: "03-multi-door-architecture.md", nav: "Multi-door architecture", section: "Getting started", tracks: ALL },
    ],
  },
  {
    title: "Authority",
    pages: [
      { slug: "engravings-and-mandates", file: "04-engravings-and-mandates.md", nav: "Engravings & mandates", section: "Authority", tracks: ["treasury"] },
      { slug: "arcium-mpc-confidential-policy", file: "05-arcium-mpc-confidential-policy.md", nav: "Confidential policy (Arcium)", section: "Authority", tracks: ["treasury"] },
      { slug: "execution-guard", file: "06-execution-guard-and-allow-invariant.md", nav: "The three checks", section: "Authority", tracks: ALL },
    ],
  },
  {
    title: "Commerce & recovery",
    pages: [
      { slug: "agreements-and-escrow", file: "07-bilateral-agreements-and-escrow.md", nav: "Agreements & escrow", section: "Commerce & recovery", tracks: ["agents", "integrators"] },
      { slug: "sagas-and-recovery", file: "08-distributed-sagas-atomic-recovery.md", nav: "Sagas & recovery", section: "Commerce & recovery", tracks: ["treasury"] },
      { slug: "keeper-daemon", file: "09-autonomous-keeper-daemon.md", nav: "Keeper daemon", section: "Commerce & recovery", tracks: ["treasury", "integrators"] },
    ],
  },
  {
    title: "Clearing",
    pages: [
      { slug: "netting", file: "10-multilateral-debt-netting.md", nav: "Netting", section: "Clearing", tracks: ["treasury", "integrators"] },
      { slug: "epoch-clearing", file: "11-epoch-clearing-algorithms.md", nav: "Epoch clearing", section: "Clearing", tracks: ["integrators"] },
    ],
  },
  {
    title: "Chains",
    pages: [
      { slug: "solana", file: "12-solana-substrate.md", nav: "Solana", section: "Chains", tracks: ["integrators"] },
      { slug: "base", file: "13-base-substrate.md", nav: "Base", section: "Chains", tracks: ["integrators"] },
      { slug: "tempo", file: "14-tempo-substrate.md", nav: "Tempo", section: "Chains", tracks: ["integrators"] },
    ],
  },
  {
    title: "Integration",
    pages: [
      { slug: "mcp-gateway", file: "15-mcp-gateway.md", nav: "MCP gateway", section: "Integration", tracks: ["agents"] },
      { slug: "agent-skills-and-tooling", file: "16-agent-skills-and-tooling.md", nav: "Skills & tooling", section: "Integration", tracks: ["agents"] },
    ],
  },
];

export const PAGES: DocPage[] = SECTIONS.flatMap((s) => s.pages);

export const pageBySlug = (slug: string) => PAGES.find((p) => p.slug === slug);
export const pageByFile = (file: string) => PAGES.find((p) => p.file === file);
