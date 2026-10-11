import type { Workspace } from "./types";

/**
 * Example data for the demo workspace, the same story as the app look board
 * (https://claude.ai/artifact/9efHw75qjq2doHTetg6zWN). Every screen labels it as demo.
 * The numbers agree with each other: escrowed deals sum to the escrow balance, clearing
 * nets to the transfers it lists.
 */
export const acme: Workspace = {
  slug: "acme",
  name: "Acme Research",
  demo: true,
  vault: [
    { chain: "Base Sepolia", asset: "USDC", free: 2400, onHold: 330, inEscrow: 600 },
    { chain: "Solana devnet", asset: "USDC", free: 800, onHold: 0, inEscrow: 120 },
    { chain: "Tempo Moderato", asset: "PathUSD", free: 0, onHold: 120, inEscrow: 380 },
  ],
  agents: [
    {
      id: "agent_research",
      wallet: "0x4a1…9c on Base Sepolia",
      registered: "2 Oct 2026",
      status: "active",
      spent: 820,
      onHold: 280,
      payments: 214,
      stopped: 3,
      limits: {
        mandateId: "mnd_7f2a",
        version: 3,
        budget: 2000,
        perPayment: 500,
        perDay: 1000,
        reviewAbove: 300,
        payees: ["Northwind Studio", "Atlas Data"],
        purposes: ["data_indexing", "research_synthesis"],
        chains: ["Base Sepolia", "Tempo Moderato"],
        ends: "10 Nov 2026",
        setBy: "Purple on 2 Oct",
      },
    },
    {
      id: "agent_scraper",
      wallet: "0x7d2…41 on Base Sepolia",
      registered: "5 Oct 2026",
      status: "active",
      spent: 320,
      onHold: 0,
      payments: 61,
      stopped: 1,
      limits: {
        mandateId: "mnd_31c",
        version: 2,
        budget: 1500,
        perPayment: 500,
        payees: ["Atlas Data"],
        purposes: ["web_scraping"],
        chains: ["Base Sepolia"],
        ends: "30 Oct 2026",
        setBy: "Purple on 5 Oct",
      },
    },
    {
      id: "agent_writer",
      wallet: "9xQ…T7 on Solana devnet",
      registered: "6 Oct 2026",
      status: "active",
      spent: 510,
      onHold: 0,
      payments: 38,
      stopped: 1,
      limits: {
        mandateId: "mnd_52e",
        version: 1,
        budget: 800,
        perPayment: 400,
        payees: ["Orbit Compute", "Northwind Studio"],
        purposes: ["rendering", "design_review"],
        chains: ["Solana devnet", "Base Sepolia"],
        ends: "6 Nov 2026",
        setBy: "Purple on 6 Oct",
      },
    },
  ],
  payments: [
    { id: "pay_9a10", time: "12:41", agentId: "agent_research", amount: 40, to: "Atlas Data", chain: "Base Sepolia", checks: ["passed", "passed", "passed"], result: "paid" },
    {
      id: "pay_8c31",
      time: "12:38",
      agentId: "agent_scraper",
      amount: 400,
      to: "0x9f3…e1",
      chain: "Base Sepolia",
      checks: ["passed", "passed", "failed"],
      result: "stopped",
      note: "Asked to pay an address its approval didn’t name.",
      detail: {
        approvedAt: "12:37:58",
        askedAt: "12:38:02",
        budgetLine: "$400.00 is under the $500.00 per-payment limit and the $1,180.00 still free.",
        rulesLine: "At 12:37:58 your rules approved $40.00 to Atlas Data for web scraping.",
        rows: [
          { field: "Who gets paid", approved: "Atlas Data · 0x4a1…9c", asked: "0x9f3…e1 (not a known payee)", ok: false, verdict: "Different" },
          { field: "How much", approved: "$40.00", asked: "$400.00", ok: false, verdict: "Different" },
          { field: "Which budget", approved: "agent_scraper · limits v2", asked: "agent_scraper · limits v2", ok: true, verdict: "Same" },
          { field: "Expires", approved: "12:47:58", asked: "asked at 12:38:02", ok: true, verdict: "In time" },
          { field: "One-time code", approved: "n_2219", asked: "n_2219", ok: true, verdict: "Unused" },
        ],
        timeline: [
          { time: "12:37:58", text: "Your rules approved $40.00 to Atlas Data.", kind: "done" },
          { time: "12:38:02", text: "agent_scraper asked to move $400.00 to 0x9f3…e1 using that approval.", kind: "done" },
          { time: "12:38:02", text: "Final check refused it: recipient and amount differ from the approval.", kind: "stop" },
          { time: "12:47:58 · later", text: "The approval will expire unused. Nothing can spend it after that.", kind: "later" },
        ],
        evidence: [
          "approval        apr_19d · decision ALLOW · mandate mnd_31c v2",
          "approved digest 0x6f0c…a41e  (recipient 0x4a1…9c, 40.00 USDC, base-sepolia, n_2219)",
          "request digest  0xd27b…09f3  (recipient 0x9f3…e1, 400.00 USDC, base-sepolia, n_2219)",
          "result          refused · digests differ · no signature issued",
        ].join("\n"),
      },
    },
    { id: "pay_7e02", time: "12:30", agentId: "agent_research", amount: 480, to: "Northwind Studio", chain: "Tempo Moderato", checks: ["passed", "not-reached", "not-reached"], result: "waiting", note: "Over $300, so it waits for you." },
    { id: "pay_6b77", time: "12:12", agentId: "agent_writer", amount: 120, to: "Orbit Compute", chain: "Solana devnet", checks: ["passed", "passed", "passed"], result: "in-escrow" },
    { id: "pay_5d40", time: "11:54", agentId: "agent_research", amount: 25, to: "Atlas Data", chain: "Base Sepolia", checks: ["passed", "passed", "passed"], result: "paid" },
    { id: "pay_4c19", time: "11:20", agentId: "agent_writer", amount: 900, to: "Orbit Compute", chain: "Solana devnet", checks: ["failed", "not-reached", "not-reached"], result: "stopped", note: "Over its $400 per-payment limit." },
    { id: "pay_3a88", time: "10:47", agentId: "agent_research", amount: 60, to: "Northwind Studio", chain: "Base Sepolia", checks: ["passed", "passed", "passed"], result: "cleared" },
  ],
  needsYou: [
    { kind: "review", agentId: "agent_research", amount: 480, to: "Northwind Studio", text: "Your rules send payments over $300 to you.", paymentId: "pay_7e02" },
    { kind: "stopped", agentId: "agent_scraper", amount: 400, to: "0x9f3…e1", text: "It asked to pay an address its approval didn’t name. Nothing moved.", paymentId: "pay_8c31" },
  ],
  deals: [
    { id: "agr_51e", title: "Brand research pack", from: "agent_research", to: "Northwind Studio", amount: 480, stage: "open", chain: "Tempo Moderato", status: "Needs you", meta: "Funding waits for your review", needsYou: true },
    { id: "agr_4b0", title: "Render 40 product images", from: "agent_writer", to: "Orbit Compute", amount: 120, stage: "funded", chain: "Solana devnet", status: "In escrow", meta: "Due in 5h 40m · escrow 3Fq…kP" },
    { id: "agr_49a", title: "Index 1,000 RPC endpoints", from: "agent_research", to: "Atlas Data", amount: 380, stage: "in-progress", chain: "Tempo Moderato", status: "In escrow", meta: "Due in 2h 10m · escrow 0x7c…3d" },
    { id: "agr_47f", title: "Design review of 12 charts", from: "agent_writer", to: "Northwind Studio", amount: 300, stage: "in-progress", chain: "Base Sepolia", status: "In escrow", meta: "Due tomorrow 09:00 · escrow 0x2e…b8" },
    { id: "agr_45c", title: "Literature summary, 30 papers", from: "Northwind Studio", to: "you judge", amount: 300, stage: "delivered", chain: "Base Sepolia", status: "In escrow", meta: "summary.pdf · sha256 9e1f…c07a", needsYou: true },
    { id: "agr_41d", title: "Pricing scrape, 200 SKUs", from: "agent_research", to: "Northwind Studio", amount: 60, stage: "done", chain: "Base Sepolia", status: "Cleared 10:00", meta: "", outcome: "cleared" },
    { id: "agr_40b", title: "Weekly data refresh", from: "agent_research", to: "Atlas Data", amount: 25, stage: "done", chain: "Base Sepolia", status: "Paid", meta: "", outcome: "paid" },
    { id: "agr_3e2", title: "GPU fine-tune run", from: "agent_writer", to: "Orbit Compute", amount: 90, stage: "done", chain: "Solana devnet", status: "Refunded", meta: "No delivery by the deadline. The escrow went back to your budget on its own.", outcome: "refunded" },
  ],
  clearing: {
    next: { at: "14:00", obligations: 11, gross: 2480, grossPayments: 11, net: 310, netPayments: 3 },
    counterparties: [
      { name: "Northwind Studio", youOwe: 700, theyOwe: 520 },
      { name: "Atlas Data", youOwe: 300, theyOwe: 240 },
      { name: "Orbit Compute", youOwe: 330, theyOwe: 390 },
    ],
    moves: [
      { from: "Acme Research", to: "Northwind Studio", amount: 180, chain: "Base Sepolia" },
      { from: "Orbit Compute", to: "Acme Research", amount: 70, chain: "Solana devnet" },
      { from: "Acme Research", to: "Atlas Data", amount: 60, chain: "Tempo Moderato" },
    ],
    past: [
      { window: "10:00", grossPayments: 8, gross: 1240, netPayments: 2, net: 160 },
      { window: "06:00", grossPayments: 5, gross: 410, netPayments: 1, net: 95 },
    ],
  },
  recoveries: [
    { id: "rcv_1", deal: "GPU fine-tune run · agr_3e2", amount: 90, reason: "No delivery by the deadline", state: "returned", when: "Today 09:12" },
  ],
};

/** A workspace that has just been created: the state every new user starts in. */
export const fresh: Workspace = {
  slug: "new",
  name: "New workspace",
  demo: false,
  vault: [],
  agents: [],
  payments: [],
  needsYou: [],
  deals: [],
  clearing: null,
  recoveries: [],
};
