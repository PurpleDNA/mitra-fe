/**
 * What the app shows. Shaped for screens, not for the engine's store: an adapter maps
 * engine records into these (see lib/app/workspaces.ts).
 */

export type Chain = "Base Sepolia" | "Solana devnet" | "Tempo Moderato";

/** One of the three checks every payment passes, in order. */
export type CheckResult = "passed" | "failed" | "not-reached";

export type PaymentResult = "paid" | "stopped" | "waiting" | "in-escrow" | "cleared";

export interface Payment {
  id: string;
  time: string;
  agentId: string;
  amount: number;
  to: string;
  chain: Chain;
  checks: [CheckResult, CheckResult, CheckResult];
  result: PaymentResult;
  /** Plain-English reason, for stopped or waiting payments. */
  note?: string;
  /** The field-by-field comparison behind a stopped payment. */
  detail?: PaymentDetail;
}

export interface PaymentDetail {
  approvedAt: string;
  askedAt: string;
  rows: { field: string; approved: string; asked: string; ok: boolean; verdict: string }[];
  timeline: { time: string; text: string; kind: "done" | "stop" | "later" }[];
  budgetLine: string;
  rulesLine: string;
  evidence: string;
}

export interface Limits {
  mandateId: string;
  version: number;
  budget: number;
  perPayment: number;
  perDay?: number;
  reviewAbove?: number;
  payees: string[];
  purposes: string[];
  chains: Chain[];
  ends: string;
  setBy: string;
}

export interface Agent {
  id: string;
  wallet: string;
  registered: string;
  status: "active" | "paused";
  spent: number;
  onHold: number;
  payments: number;
  stopped: number;
  limits?: Limits;
}

export type DealStage = "open" | "funded" | "in-progress" | "delivered" | "done";

export interface Deal {
  id: string;
  title: string;
  from: string;
  to: string;
  amount: number;
  stage: DealStage;
  chain: Chain;
  status: string;
  meta: string;
  /** For a delivered deal you judge, or an open one waiting for you. */
  needsYou?: boolean;
  outcome?: "paid" | "cleared" | "refunded";
}

export interface ClearingView {
  next: { at: string; obligations: number; gross: number; grossPayments: number; net: number; netPayments: number };
  counterparties: { name: string; youOwe: number; theyOwe: number }[];
  moves: { from: string; to: string; amount: number; chain: Chain }[];
  past: { window: string; grossPayments: number; gross: number; netPayments: number; net: number }[];
}

export interface Recovery {
  id: string;
  deal: string;
  amount: number;
  reason: string;
  state: "returned" | "returning";
  when: string;
}

export interface VaultBalance {
  chain: Chain;
  asset: string;
  free: number;
  onHold: number;
  inEscrow: number;
}

export interface Workspace {
  slug: string;
  name: string;
  /** A demo workspace is example data: nothing in it moves money. */
  demo: boolean;
  vault: VaultBalance[];
  agents: Agent[];
  payments: Payment[];
  needsYou: { kind: "review" | "stopped"; agentId: string; amount: number; to: string; text: string; paymentId: string }[];
  deals: Deal[];
  clearing: ClearingView | null;
  recoveries: Recovery[];
}

/** Where a new workspace is on the way to its first payment. */
export interface Onboarding {
  hasVault: boolean;
  hasAgent: boolean;
  hasLimits: boolean;
  hasActivity: boolean;
}
