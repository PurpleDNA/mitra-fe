import { formatUnits } from "viem";
import type { CheckResult } from "@/lib/app/types";
import { POLICY_ENGINE } from "./config";
import type { ChainMandate } from "./hooks";

/**
 * A dry run of the checks a payment would meet, evaluated in the browser against an
 * agent's real limits and the vault as read from the chain. Nothing is signed or sent.
 *
 * Each rule is copied from where it is really enforced, with that place's own code:
 *   vault contract  contracts/MitraVault.sol spendAuthorized (VAULT_FROZEN, INSUFFICIENT_AVAILABLE,
 *                   EXCEEDS_MANDATE_CEILING, MANDATE_REVOKED, MANDATE_EXPIRED)
 *   engine          lib/adapters/evm-vault-transport.ts before it signs (EXCEEDS_MANDATE_LIMIT,
 *                   POLICY_ENGINE_MISMATCH, MANDATE_NOT_FOUND) and lib/kernel/authorization.ts
 *                   (CAPABILITY_NOT_ALLOWED)
 * The third check, exact match, compares the signed instruction with what was approved.
 * A dry run signs nothing, so it never reaches it, and says so.
 */

/** The engine's default when a mandate names no capabilities (app/api/v1/mandates/route.ts). */
export const ENGINE_DEFAULT_CAPABILITIES = ["payment", "research"];

export interface DryRunReason {
  code: string;
  where: "vault contract" | "engine";
  text: string;
}

export interface DryRun {
  allowed: boolean;
  checks: [CheckResult, CheckResult, CheckResult];
  reasons: DryRunReason[];
  headline: string;
}

const usd = (atomic: bigint) =>
  `$${Number(formatUnits(atomic, 6)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export function dryRun(input: {
  mandate: ChainMandate | null;
  vault: { available: bigint; emergencyFreeze: boolean } | undefined;
  capabilities: string[];
  amount: bigint;
  capability: string;
  now?: number;
}): DryRun {
  const { mandate: m, vault, amount, capability } = input;
  const now = BigInt(Math.floor((input.now ?? Date.now()) / 1000));
  const allowedCaps = input.capabilities.length ? input.capabilities : ENGINE_DEFAULT_CAPABILITIES;

  const budget: DryRunReason[] = [];
  const rules: DryRunReason[] = [];

  if (!vault || vault.emergencyFreeze) {
    budget.push({ code: "VAULT_FROZEN", where: "vault contract", text: "The vault is paused, so nothing can leave it." });
  } else if (amount > vault.available) {
    budget.push({
      code: "INSUFFICIENT_AVAILABLE",
      where: "vault contract",
      text: `The vault has ${usd(vault.available)} free, less than ${usd(amount)}.`,
    });
  }
  if (m && m.spent + amount > m.ceiling) {
    budget.push({
      code: "EXCEEDS_MANDATE_CEILING",
      where: "vault contract",
      text: `${usd(amount)} would take the agent past its ${usd(m.ceiling)} budget (${usd(m.ceiling - m.spent)} left).`,
    });
  }

  if (!m) {
    rules.push({ code: "MANDATE_NOT_FOUND", where: "engine", text: "This agent has no limits from you, so it can’t spend at all." });
  } else {
    if (m.revoked) rules.push({ code: "MANDATE_REVOKED", where: "vault contract", text: "This agent’s limits were revoked." });
    if (now >= m.expiresAt) rules.push({ code: "MANDATE_EXPIRED", where: "vault contract", text: "This agent’s limits have ended." });
    if (m.policyEngine.toLowerCase() !== POLICY_ENGINE.toLowerCase()) {
      rules.push({ code: "POLICY_ENGINE_MISMATCH", where: "engine", text: "These limits name a different policy engine." });
    }
    if (amount > m.limit) {
      rules.push({
        code: "EXCEEDS_MANDATE_LIMIT",
        where: "engine",
        text: `${usd(amount)} is over this agent’s ${usd(m.limit)} cap per payment.`,
      });
    }
  }
  if (!allowedCaps.includes(capability)) {
    rules.push({
      code: "CAPABILITY_NOT_ALLOWED",
      where: "engine",
      text: `“${capability || "(none)"}” isn’t one of the things this agent may pay for (${allowedCaps.join(", ")}).`,
    });
  }

  const checks: [CheckResult, CheckResult, CheckResult] = budget.length
    ? ["failed", "not-reached", "not-reached"]
    : rules.length
      ? ["passed", "failed", "not-reached"]
      : ["passed", "passed", "not-reached"];
  const reasons = [...budget, ...rules];
  const allowed = reasons.length === 0;
  const headline = allowed
    ? `Would be approved: ${usd(amount)} for ${capability}.`
    : `Blocked: ${reasons[0].text} Nothing would move.`;
  return { allowed, checks, reasons, headline };
}
