"use client";

import { useCallback, useEffect, useState } from "react";
import { useSignTypedData } from "wagmi";
import { ENGINE_PLAIN, engineGet, enginePost, type EngineReply } from "@/lib/engine/client";
import { engineAgentId, mitraRequestTypedData, syncRequest, type CardSync } from "@/lib/engine/request";
import { ENGINE_DEFAULT_CAPABILITIES } from "@/lib/chain/dryrun";
import { useNet, type ChainMandate, type SavedAgent } from "@/lib/chain/hooks";
import { Audit } from "./Wallet";

interface EngineAgent {
  agentId: string;
  wallets: { chain: string; address: string }[];
}
interface EngineMandate {
  mandateId: string;
  version: number;
  allowedCapabilities: string[];
  budget: number;
  maxTransaction: number;
  expiresAt: string;
}

type View =
  | { kind: "loading" }
  | { kind: "unavailable"; reply: EngineReply }
  | { kind: "unregistered" }
  | { kind: "other-wallet" }
  | { kind: "ready"; synced: EngineMandate | null };

const sameSet = (a: string[], b: string[]) => a.length === b.length && [...a].sort().join() === [...b].sort().join();

/**
 * Where this card stands with the Mitra engine, and the one action that moves it on:
 * "Sync with Mitra". The vault owner's wallet signs the card (a message, not a
 * transaction); the engine checks the signature, reads the limits from the vault
 * contract itself, and from then on can pay this agent's agreements from this vault.
 * See ../mitra lib/kernel/card-sync.ts.
 */
export function EngineSync({
  agent,
  mandate,
  principal,
  active,
}: {
  agent: SavedAgent;
  mandate: ChainMandate | null;
  principal: `0x${string}`;
  /** Whether the on-chain card is live (opened, not revoked, not expired). */
  active: boolean;
}) {
  const net = useNet();
  const agentId = engineAgentId(agent.name, agent.address);
  const mandateId = `mandate_${net.key}_${principal.toLowerCase()}_${agent.address.toLowerCase()}`;
  const capabilities = agent.capabilities?.length ? agent.capabilities : ENGINE_DEFAULT_CAPABILITIES;
  const [view, setView] = useState<View>({ kind: "loading" });
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; text: string; code?: string } | null>(null);
  const { signTypedDataAsync } = useSignTypedData();

  const load = useCallback(async () => {
    const a = await engineGet<EngineAgent | null>(`agents?agentId=${encodeURIComponent(agentId)}`);
    if (!a.ok) return setView({ kind: "unavailable", reply: a });
    if (!a.data) return setView({ kind: "unregistered" });
    const holds = a.data.wallets.some((w) => w.chain === net.key && w.address.toLowerCase() === agent.address.toLowerCase());
    if (!holds) return setView({ kind: "other-wallet" });
    const m = await engineGet<EngineMandate | null>(`mandates?mandateId=${encodeURIComponent(mandateId)}`);
    if (!m.ok) return setView({ kind: "unavailable", reply: m });
    setView({ kind: "ready", synced: m.data ?? null });
  }, [agentId, mandateId, net.key, agent.address]);

  useEffect(() => {
    void load();
  }, [load]);

  // A message about a sync is about THAT sync: clear it when the card's capabilities change.
  const capsKey = capabilities.join(",");
  useEffect(() => {
    setResult(null);
  }, [capsKey]);

  async function sync() {
    setBusy(true);
    setResult(null);
    const card: CardSync = {
      chain: net.key,
      principal,
      holder: agent.address,
      agentId,
      capabilities,
      // Who the agent may pay. Anyone, for now: the per-payment cap and budget on chain,
      // and the capabilities above, are what bound it.
      counterparties: ["*"],
      issuedAt: Math.floor(Date.now() / 1000),
    };
    let signature: `0x${string}`;
    try {
      signature = await signTypedDataAsync(mitraRequestTypedData(syncRequest(card), net.chain.id));
    } catch {
      setBusy(false);
      setResult({ ok: false, text: "You declined in your wallet. Nothing was sent." });
      return;
    }
    const r = await enginePost("sync", { card, auth: { signer: principal, chainId: net.chain.id, signature } });
    setBusy(false);
    if (r.ok) {
      setResult({ ok: true, text: "Synced. The engine read your limits from the chain and can now pay this agent’s agreements from your vault." });
      void load();
    } else {
      setResult({ ok: false, text: ENGINE_PLAIN[r.error ?? ""] ?? `The engine refused: ${r.error ?? r.status}`, code: [r.error, r.detail].filter(Boolean).join(" · ") });
    }
  }

  const button = (label: string, dark: boolean) => (
    <button type="button" className={`btn ${dark ? "btn-dark" : "btn-line"} ap-btn`} onClick={sync} disabled={busy}>
      {busy ? "Check your wallet…" : label}
    </button>
  );

  let line: React.ReactNode;
  let action: React.ReactNode = null;
  if (view.kind === "loading") {
    line = "Checking with the Mitra engine…";
  } else if (view.kind === "unavailable") {
    line = ENGINE_PLAIN[view.reply.error ?? ""] ?? `The Mitra engine answered ${view.reply.status}.`;
  } else if (view.kind === "unregistered") {
    line = "The engine doesn’t know this agent yet. A wallet generated here registers itself; any other agent registers with its own key (Connect → step 1).";
  } else if (view.kind === "other-wallet") {
    line = "The engine knows this agent under a different wallet, so it can’t pay this card.";
  } else if (!mandate || !active) {
    line = "Registered with the engine. Open live limits for it, then sync.";
  } else if (!view.synced) {
    line = "Registered with the engine. Sync so it can pay from this card: your wallet signs a message, no transaction and no gas.";
    action = button("Sync with Mitra", true);
  } else {
    const stale = view.synced.version < mandate.version || !sameSet(view.synced.allowedCapabilities, capabilities);
    line = stale
      ? `The engine has an older copy of this card (v${view.synced.version}). Sync again so it uses your current limits and capabilities.`
      : `Synced with Mitra · v${view.synced.version} · may pay for ${view.synced.allowedCapabilities.join(", ")}.`;
    action = button(stale ? "Sync again" : "Re-sync", stale);
  }

  const ok = view.kind === "ready" && view.synced && mandate && view.synced.version >= mandate.version && sameSet(view.synced.allowedCapabilities, capabilities);
  return (
    <div className={`lv-engine${ok ? " ok" : ""}`}>
      <div className="lv-engine-row">
        <span className="tag">Mitra engine</span>
        <span className="lv-engine-t">{line}</span>
        {action}
      </div>
      {result ? (
        <div className={`lv-tx ${result.ok ? "done" : "failed"}`} role="status">
          <p>{result.text}</p>
          {result.code ? <Audit rows={[["Engine reason", result.code]]} /> : null}
        </div>
      ) : null}
    </div>
  );
}
