"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useState } from "react";
import { BaseError, ContractFunctionRevertedError, formatUnits, parseUnits, type Abi } from "viem";
import { useAccount, usePublicClient, useReadContract, useReadContracts, useWriteContract } from "wagmi";
import { supabaseBrowser } from "@/lib/supabase/client";
import { DEFAULT_NET, ERC20_ABI, netFor, VAULT_ABI, type Net } from "./config";

/**
 * The network the app is working on: the one the connected wallet is on, when Mitra has
 * a vault there; otherwise the default (Base Sepolia), which is also what a signed-out or
 * disconnected visitor sees.
 */
export function useNet(): Net {
  const { chainId } = useAccount();
  return netFor(chainId) ?? DEFAULT_NET;
}

/** The connected wallet, if it is on a network Mitra has a vault on. It is the vault's principal. */
export function usePrincipal() {
  const { address, isConnected, chainId } = useAccount();
  const net = useNet();
  return { principal: address, isConnected, onChain: netFor(chainId) !== null, net };
}

/** Both tokens have 6 decimals (config.ts). */
const DECIMALS = 6;
export const toUnits = (atomic: bigint | undefined) => (atomic === undefined ? 0 : Number(formatUnits(atomic, DECIMALS)));
export const fromUnits = (amount: string) => parseUnits(amount.trim() || "0", DECIMALS);

/** Keeps an amount field to digits and one point. */
export const cleanAmount = (v: string) => v.replace(/[^0-9.]/g, "").replace(/(\..*)\./g, "$1");

/** A positive amount in atomic units, or null if the field does not hold one. */
export function parseAmount(v: string): bigint | null {
  if (!/^\d*\.?\d{0,6}$/.test(v) || !/\d/.test(v)) return null;
  const n = fromUnits(v);
  return n > 0n ? n : null;
}

/** The principal's position in the vault, read from the contract. */
export function useVaultPosition(principal?: `0x${string}`) {
  const net = useNet();
  const q = useReadContract({
    address: net.vault,
    abi: VAULT_ABI,
    functionName: "vaults",
    args: principal ? [principal, net.token.address] : undefined,
    chainId: net.chain.id,
    query: { enabled: Boolean(principal) },
  });
  const [total, available, reserved, escrowed, encumbered, settling, frozen, emergencyFreeze] = q.data ?? [];
  return {
    ...q,
    position: q.data ? { total: total!, available: available!, reserved: reserved!, escrowed: escrowed!, encumbered: encumbered!, settling: settling!, frozen: frozen!, emergencyFreeze: emergencyFreeze! } : undefined,
  };
}

/** The network's token in the wallet itself, and how much the vault may pull from it. */
export function useWalletToken(principal?: `0x${string}`) {
  const net = useNet();
  const q = useReadContracts({
    contracts: principal
      ? [
          { address: net.token.address, abi: ERC20_ABI, functionName: "balanceOf", args: [principal], chainId: net.chain.id },
          { address: net.token.address, abi: ERC20_ABI, functionName: "allowance", args: [principal, net.vault], chainId: net.chain.id },
        ]
      : [],
    query: { enabled: Boolean(principal) },
  });
  return { ...q, balance: q.data?.[0]?.result as bigint | undefined, allowance: q.data?.[1]?.result as bigint | undefined };
}

/**
 * The agents this account has registered for this vault owner. The contract has no list
 * of holders (a mandate is looked up by address), so the list, names and capabilities
 * live in the account database (Supabase table `agents`, row-level security: only the
 * signed-in account sees its rows). Everything money-shaped about each agent is read
 * from the chain.
 */
export interface SavedAgent {
  name: string;
  address: `0x${string}`;
  addedAt: string;
  /** What the agent may pay for. Engine policy, not vault state: see AgentsLive. */
  capabilities?: string[];
}

interface AgentRow {
  name: string;
  address: string;
  created_at: string;
  capabilities: string[];
}

const toAgent = (r: AgentRow): SavedAgent => ({
  name: r.name,
  address: r.address as `0x${string}`,
  addedAt: r.created_at,
  capabilities: r.capabilities,
});

/** Where agents lived before accounts. Imported into the account once, then cleared. */
const legacyKey = (chainId: number, principal: string) => `mitra:agents:${chainId}:${principal.toLowerCase()}`;

export function useSavedAgents(principal?: `0x${string}`) {
  const [agents, setAgents] = useState<SavedAgent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const owner = principal?.toLowerCase();
  const chainId = useNet().chain.id;

  const reload = useCallback(async () => {
    if (!owner) return;
    const { data, error } = await supabaseBrowser()
      .from("agents")
      .select("name, address, created_at, capabilities")
      .eq("chain_id", chainId)
      .eq("principal", owner)
      .order("created_at");
    if (error) {
      setError(`Couldn’t load your agents: ${error.message}`);
      return;
    }
    setError(null);
    setAgents((data as AgentRow[]).map(toAgent));
    setLoaded(true);
  }, [owner, chainId]);

  useEffect(() => {
    setAgents([]);
    setLoaded(false);
    if (!owner) return;
    void (async () => {
      await importLegacy(chainId, owner);
      await reload();
    })();
  }, [owner, chainId, reload]);

  const add = useCallback(
    async (a: Omit<SavedAgent, "addedAt">) => {
      if (!owner) return;
      const { error } = await supabaseBrowser()
        .from("agents")
        .upsert(
          { chain_id: chainId, principal: owner, address: a.address.toLowerCase(), name: a.name, capabilities: a.capabilities ?? [] },
          { onConflict: "user_id,chain_id,principal,address" },
        );
      if (error) setError(`Couldn’t save the agent: ${error.message}`);
      await reload();
    },
    [owner, chainId, reload],
  );

  const remove = useCallback(
    async (address: string) => {
      if (!owner) return;
      const { error } = await supabaseBrowser()
        .from("agents")
        .delete()
        .eq("chain_id", chainId)
        .eq("principal", owner)
        .eq("address", address.toLowerCase());
      if (error) setError(`Couldn’t remove the agent: ${error.message}`);
      await reload();
    },
    [owner, chainId, reload],
  );

  const update = useCallback(
    async (address: string, patch: Partial<Omit<SavedAgent, "address" | "addedAt">>) => {
      if (!owner) return;
      const { error } = await supabaseBrowser()
        .from("agents")
        .update({ ...(patch.name ? { name: patch.name } : {}), ...(patch.capabilities ? { capabilities: patch.capabilities } : {}) })
        .eq("chain_id", chainId)
        .eq("principal", owner)
        .eq("address", address.toLowerCase());
      if (error) setError(`Couldn’t save the change: ${error.message}`);
      await reload();
    },
    [owner, chainId, reload],
  );

  return { agents, loaded, error, add, remove, update };
}

/** Moves agents saved in this browser before accounts existed into the account, then forgets them here. */
async function importLegacy(chainId: number, owner: string) {
  let legacy: SavedAgent[] = [];
  try {
    legacy = JSON.parse(localStorage.getItem(legacyKey(chainId, owner)) ?? "[]") as SavedAgent[];
  } catch {
    return;
  }
  if (legacy.length === 0) return;
  const rows = legacy.map((a) => ({
    chain_id: chainId,
    principal: owner,
    address: a.address.toLowerCase(),
    name: a.name.slice(0, 48) || "Agent",
    capabilities: a.capabilities ?? [],
  }));
  const { error } = await supabaseBrowser()
    .from("agents")
    .upsert(rows, { onConflict: "user_id,chain_id,principal,address", ignoreDuplicates: true });
  if (!error) {
    try {
      localStorage.removeItem(legacyKey(chainId, owner));
    } catch {
      // Storage blocked: the import is idempotent, so a second run changes nothing.
    }
  }
}

export interface ChainMandate {
  limit: bigint;
  ceiling: bigint;
  spent: bigint;
  expiresAt: bigint;
  version: number;
  policyEngine: `0x${string}`;
  revoked: boolean;
}

/** The on-chain mandate for each holder, or null where none was opened. */
export function useMandates(principal: `0x${string}` | undefined, holders: `0x${string}`[]) {
  const net = useNet();
  const q = useReadContracts({
    contracts: principal
      ? holders.map((h) => ({
          address: net.vault,
          abi: VAULT_ABI,
          functionName: "mandates" as const,
          args: [principal, h, net.token.address] as const,
          chainId: net.chain.id,
        }))
      : [],
    query: { enabled: Boolean(principal) && holders.length > 0 },
  });
  const byHolder = new Map<string, ChainMandate | null>();
  holders.forEach((h, i) => {
    const r = q.data?.[i]?.result as readonly [string, string, bigint, bigint, bigint, bigint, number, `0x${string}`, boolean] | undefined;
    if (!r) return;
    byHolder.set(
      h.toLowerCase(),
      r[6] === 0 ? null : { limit: r[2], ceiling: r[3], spent: r[4], expiresAt: r[5], version: r[6], policyEngine: r[7], revoked: r[8] },
    );
  });
  return { ...q, byHolder };
}

export type TxState =
  | { status: "idle" }
  | { status: "signing"; label: string }
  | { status: "pending"; label: string; hash: `0x${string}`; explorer: string }
  | { status: "done"; label: string; hash: `0x${string}`; explorer: string }
  | { status: "failed"; label: string; error: string; code?: string; hash?: `0x${string}`; explorer: string };

/**
 * What a contract refusal means, in words. The code itself is kept for the audit
 * details: the plain sentence is for the person, the code is the evidence.
 */
export const PLAIN: Record<string, string> = {
  INSUFFICIENT_AVAILABLE: "There isn’t that much free in the vault. Money held for payments can’t be withdrawn.",
  VAULT_EMERGENCY_FROZEN: "The vault is paused. Resume it first.",
  VAULT_FROZEN: "The vault is paused. Resume it first.",
  MANDATE_ALREADY_EXISTS: "This agent’s wallet already has limits from you. Limits can’t be reopened for the same wallet.",
  EXCEEDS_MANDATE_CEILING: "The per-payment cap must be above zero and no bigger than the budget.",
  INVALID_EXPIRY: "The end date must be in the future.",
  INVALID_POLICY_ENGINE: "No policy engine was named.",
  UNAUTHORIZED_PRINCIPAL: "Only the wallet that set these limits can change them.",
  UNAUTHORIZED: "Only you or the agent can revoke these limits.",
  MANDATE_REVOKED: "These limits were revoked and can’t be changed.",
  ALREADY_REVOKED: "These limits are already revoked.",
  MANDATE_EXPIRED: "These limits have ended and can’t be changed.",
  INVALID_AMOUNT: "Enter an amount above zero.",
};

/** The contract's own revert reason where there is one, so the screen says what the chain said. */
export function txError(e: unknown): { error: string; code?: string } {
  if (e instanceof BaseError) {
    const revert = e.walk((x) => x instanceof ContractFunctionRevertedError);
    if (revert instanceof ContractFunctionRevertedError && revert.reason) {
      return { error: PLAIN[revert.reason] ?? revert.reason, code: revert.reason };
    }
    if (/user rejected|denied/i.test(e.shortMessage)) return { error: "You declined it in your wallet. Nothing was sent." };
    return { error: e.shortMessage };
  }
  return { error: e instanceof Error ? e.message : String(e) };
}

/**
 * Sends a contract call from the connected wallet and waits for the receipt. Only a
 * receipt with status "success" counts as done; anything else is shown as failed.
 */
export function useTx() {
  const [state, setState] = useState<TxState>({ status: "idle" });
  const { writeContractAsync } = useWriteContract();
  const net = useNet();
  const client = usePublicClient({ chainId: net.chain.id });
  const queryClient = useQueryClient();

  const send = useCallback(
    async <A extends Abi>(label: string, call: { address: `0x${string}`; abi: A; functionName: string; args: readonly unknown[] }) => {
      setState({ status: "signing", label });
      let hash: `0x${string}` | undefined;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        hash = await writeContractAsync({ ...(call as any), chainId: net.chain.id });
        setState({ status: "pending", label, hash: hash!, explorer: net.explorer });
        const receipt = await client!.waitForTransactionReceipt({ hash: hash! });
        await queryClient.invalidateQueries();
        if (receipt.status !== "success") {
          setState({ status: "failed", label, hash, error: "The transaction reverted.", explorer: net.explorer });
          return false;
        }
        setState({ status: "done", label, hash: hash!, explorer: net.explorer });
        return true;
      } catch (e) {
        setState({ status: "failed", label, hash, ...txError(e), explorer: net.explorer });
        return false;
      }
    },
    [client, net, queryClient, writeContractAsync],
  );

  const busy = state.status === "signing" || state.status === "pending";
  return { state, send, busy, reset: () => setState({ status: "idle" }) };
}
