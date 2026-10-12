"use client";

import { useConnectModal } from "@rainbow-me/rainbowkit";
import Link from "next/link";
import { POLICY_ENGINE, USDC, VAULT, VAULT_ABI } from "@/lib/chain/config";
import { useMandates, usePrincipal, useSavedAgents, useTx, useVaultPosition } from "@/lib/chain/hooks";
import { TxLine } from "./Wallet";

/**
 * The five steps between a new workspace and its first payment, each one read from the
 * chain for the connected wallet: connected, vault funded, an agent registered, limits
 * open for it, and an agent that has spent under them.
 */
export function StepsLive({ ws }: { ws: string }) {
  const { principal, isConnected, onChain } = usePrincipal();
  const { openConnectModal } = useConnectModal();
  const { position } = useVaultPosition(principal);
  const { agents } = useSavedAgents(principal);
  const { byHolder } = useMandates(
    principal,
    agents.map((a) => a.address),
  );
  const mandates = [...byHolder.values()].filter((m) => m && !m.revoked && m.policyEngine.toLowerCase() === POLICY_ENGINE.toLowerCase());

  const connected = isConnected && onChain;
  const steps = [
    {
      done: connected,
      title: "Connect your wallet",
      body: "The wallet that owns the vault. Only it can withdraw or give agents limits.",
      action: { onClick: openConnectModal, cta: "Connect wallet" },
    },
    {
      done: connected && (position?.total ?? 0n) > 0n,
      title: "Set up the vault",
      body: "Move test USDC into Mitra’s vault on Base Sepolia. It stays there until a payment passes all three checks.",
      href: `/app/${ws}/vault`,
      cta: "Set up the vault",
    },
    {
      done: connected && agents.length > 0,
      title: "Register an agent",
      body: "Name the agent and give Mitra the wallet it signs with.",
      href: `/app/${ws}/agents`,
      cta: "Register an agent",
    },
    {
      done: connected && mandates.length > 0,
      title: "Give it limits",
      body: "A budget, a cap per payment and an end date, opened in the vault from your wallet. The agent can’t change them.",
      href: `/app/${ws}/agents`,
      cta: "Set its limits",
    },
    {
      done: connected && mandates.some((m) => m!.spent > 0n),
      title: "Connect it and let it work",
      body: "Point the agent at Mitra over MCP or the SDK. This step completes when it first spends under its limits.",
      href: `/app/${ws}/developers#connect`,
      cta: "Connect the agent",
    },
  ];
  const next = steps.findIndex((s) => !s.done);

  return (
    <ol className="ap-steps lv-steps">
      {steps.map((s, i) => (
        <li key={s.title} className={s.done ? "done" : i === next ? "next" : undefined}>
          <span className="ap-step-n">{s.done ? "✓" : String(i + 1).padStart(2, "0")}</span>
          <span className="ap-step-t">{s.title}</span>
          <span className="ap-step-b">{s.body}</span>
          {s.done ? (
            <span className="tag">Done</span>
          ) : "action" in s && s.action ? (
            <button type="button" className={`btn ${i === next ? "btn-dark" : "btn-line"} ap-btn`} onClick={s.action.onClick}>
              {s.action.cta} <span aria-hidden="true">→</span>
            </button>
          ) : (
            <Link href={s.href!} className={`btn ${i === next ? "btn-dark" : "btn-line"} ap-btn`}>
              {s.cta} <span aria-hidden="true">→</span>
            </Link>
          )}
        </li>
      ))}
    </ol>
  );
}

/**
 * "Pause all": the vault's emergency freeze, sent from the owner's wallet. While it is
 * on, the contract refuses every agent payment and every withdrawal from this vault.
 */
export function PauseAll() {
  const { principal, isConnected, onChain } = usePrincipal();
  const { position } = useVaultPosition(principal);
  const tx = useTx();
  if (!isConnected || !onChain || !position || position.total === 0n) return null;
  const frozen = position.emergencyFreeze;
  return (
    <span className="ap-act">
      <button
        type="button"
        className={`btn ${frozen ? "btn-dark" : "btn-line"} ap-btn`}
        disabled={tx.busy}
        onClick={() =>
          tx.send(frozen ? "Resume" : "Pause all", { address: VAULT, abi: VAULT_ABI, functionName: "setEmergencyFreeze", args: [USDC.address, !frozen] })
        }
      >
        {frozen ? null : <span className="ap-dot-stop" aria-hidden="true" />}
        {frozen ? "Resume payments" : "Pause all"}
      </button>
      {tx.state.status !== "idle" ? <TxLine state={tx.state} /> : frozen ? <span className="ap-said">Paused: nothing can leave the vault.</span> : null}
    </span>
  );
}
