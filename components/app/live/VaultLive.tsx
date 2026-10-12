"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { ERC20_ABI, explorerAddress, NETWORKS, VAULT_ABI, type Net } from "@/lib/chain/config";
import { cleanAmount as clean, parseAmount as parse, toUnits, usePrincipal, useTx, useVaultPosition, useWalletToken } from "@/lib/chain/hooks";
import { money } from "@/lib/app/workspaces";
import { ConnectFirst, TxLine, short } from "./Wallet";

/**
 * The vault, read from the MitraVault contract for the connected wallet. Depositing is
 * two transactions from that wallet (approve, then deposit); withdrawing is one. Your
 * wallet is the vault's principal: only it can withdraw, and only it can open limits.
 */
export function VaultLive() {
  return (
    <ConnectFirst
      title="Connect the wallet that will own the vault"
      body={`Your vault is your position in Mitra’s vault contract on ${NETWORKS.map((n) => n.label).join(" or ")}, keyed by your wallet. Only that wallet can withdraw from it or give agents limits.`}
    >
      <VaultPanel />
    </ConnectFirst>
  );
}

function VaultPanel() {
  const { principal, net } = usePrincipal();
  const T = net.token;
  const { position, isLoading } = useVaultPosition(principal);
  const wallet = useWalletToken(principal);
  const tx = useTx();
  const [dep, setDep] = useState("");
  const [wd, setWd] = useState("");

  const held = position ? position.reserved + position.escrowed + position.encumbered + position.settling + position.frozen : 0n;
  const hasVault = (position?.total ?? 0n) > 0n;

  async function deposit() {
    const amount = parse(dep);
    if (!amount || !principal) return;
    if ((wallet.allowance ?? 0n) < amount) {
      const ok = await tx.send(`Allow the vault to take ${dep} ${T.symbol}`, {
        address: T.address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [net.vault, amount],
      });
      if (!ok) return;
    }
    const ok = await tx.send(`Deposit ${dep} ${T.symbol}`, { address: net.vault, abi: VAULT_ABI, functionName: "deposit", args: [T.address, amount] });
    if (ok) setDep("");
  }

  async function withdraw() {
    const amount = parse(wd);
    if (!amount || !principal) return;
    const ok = await tx.send(`Withdraw ${wd} ${T.symbol}`, {
      address: net.vault,
      abi: VAULT_ABI,
      functionName: "withdraw",
      args: [T.address, amount, principal],
    });
    if (ok) setWd("");
  }

  const depAmt = parse(dep);
  const wdAmt = parse(wd);
  const depTooMuch = depAmt !== null && wallet.balance !== undefined && depAmt > wallet.balance;
  const wdTooMuch = wdAmt !== null && position !== undefined && wdAmt > position.available;

  return (
    <>
      <div className="ap-stats">
        <div className="ap-stat">
          <span className="tag">Free to spend</span>
          <span className="ap-stat-v">{isLoading ? "…" : money(toUnits(position?.available))}</span>
          <span className="ap-stat-n">{T.symbol} · {net.label}</span>
        </div>
        <div className="ap-stat">
          <span className="tag">Held</span>
          <span className="ap-stat-v">{isLoading ? "…" : money(toUnits(held))}</span>
          <span className="ap-stat-n">Reserved, in escrow or settling</span>
        </div>
        <div className="ap-stat tinted">
          <span className="tag">In the vault</span>
          <span className="ap-stat-v">{isLoading ? "…" : money(toUnits(position?.total))}</span>
          <span className="ap-stat-n">{position?.emergencyFreeze ? "Paused: nothing can leave" : "Total, all positions"}</span>
        </div>
        <div className="ap-stat">
          <span className="tag">In your wallet</span>
          <span className="ap-stat-v">{wallet.isLoading ? "…" : money(toUnits(wallet.balance))}</span>
          <span className="ap-stat-n">Not in Mitra yet</span>
        </div>
      </div>

      {position && position.total > 0n ? <Gauge free={position.available} held={held} /> : null}

      {position?.emergencyFreeze ? (
        <p className="lv-note stop">
          <span className="ap-dot-stop" aria-hidden="true" /> This vault is paused. No agent payment can leave it and withdrawals are
          blocked until you resume it (top right).
        </p>
      ) : null}

      <div className="lv-grid">
        <form
          className="lv-card"
          onSubmit={(e) => {
            e.preventDefault();
            void deposit();
          }}
        >
          <h2>{hasVault ? "Add money" : "Fund your vault"}</h2>
          <p>
            Moves {T.symbol} from your wallet into the vault. The first time, your wallet asks twice: once to let the vault take
            the amount, once to deposit it.
          </p>
          <label className="lv-field">
            <span className="tag">Amount ({T.symbol})</span>
            <span className="lv-row">
              <input inputMode="decimal" placeholder="10.00" value={dep} onChange={(e) => setDep(clean(e.target.value))} />
              <button type="button" className="lv-max" onClick={() => setDep(String(toUnits(wallet.balance)))}>
                Max
              </button>
            </span>
          </label>
          {depTooMuch ? <p className="lv-err">That is more than your wallet holds.</p> : null}
          {wallet.balance === 0n ? <Faucet net={net} address={principal!} /> : <p className="lv-hint">{net.gasNote}</p>}
          <button type="submit" className="btn btn-dark ap-btn" disabled={tx.busy || !depAmt || depTooMuch}>
            {hasVault ? "Deposit" : "Set up the vault"} <span aria-hidden="true">→</span>
          </button>
        </form>

        <form
          className="lv-card"
          onSubmit={(e) => {
            e.preventDefault();
            void withdraw();
          }}
        >
          <h2>Withdraw</h2>
          <p>Back to your wallet. Only free money can leave; what is held for a payment stays until that payment finishes.</p>
          <label className="lv-field">
            <span className="tag">Amount ({T.symbol})</span>
            <span className="lv-row">
              <input inputMode="decimal" placeholder="0.00" value={wd} onChange={(e) => setWd(clean(e.target.value))} />
              <button type="button" className="lv-max" onClick={() => setWd(String(toUnits(position?.available)))}>
                Max
              </button>
            </span>
          </label>
          {wdTooMuch ? <p className="lv-err">That is more than is free to spend.</p> : null}
          <button type="submit" className="btn btn-line ap-btn" disabled={tx.busy || !wdAmt || wdTooMuch || !hasVault}>
            Withdraw
          </button>
        </form>
      </div>

      <TxLine state={tx.state} />

      <dl className="lv-facts">
        <div>
          <dt className="tag">Vault contract</dt>
          <dd>
            <a href={explorerAddress(net, net.vault)} target="_blank" rel="noreferrer" className="mono">
              {short(net.vault)} ↗
            </a>
          </dd>
        </div>
        <div>
          <dt className="tag">Owner (you)</dt>
          <dd className="mono">{principal ? short(principal) : "—"}</dd>
        </div>
        <div>
          <dt className="tag">Network</dt>
          <dd>{net.label} · test network</dd>
        </div>
      </dl>
    </>
  );
}

/** Where the vault's money is, as one bar: free to spend, and held for payments in flight. */
function Gauge({ free, held }: { free: bigint; held: bigint }) {
  const total = free + held;
  const pct = (x: bigint) => (total > 0n ? Number((x * 1000n) / total) / 10 : 0);
  return (
    <div className="lv-gauge">
      <div className="lv-gauge-bar" role="img" aria-label={`${pct(free)}% free to spend, ${pct(held)}% held`}>
        <span className="free" style={{ width: `${pct(free)}%` }} />
        <span className="held" style={{ width: `${pct(held)}%` }} />
      </div>
      <div className="lv-gauge-key ap-meta">
        <span>
          <i className="free" /> Free {pct(free)}%
        </span>
        <span>
          <i className="held" /> Held {pct(held)}%
        </span>
        <span>Read from the vault contract, to the last unit.</span>
      </div>
    </div>
  );
}

/**
 * Where to get free test money. On Base Sepolia that is Circle's faucet, a link. On
 * Tempo Moderato it is the network's own tempo_fundAddress, which this button calls for
 * the connected address; the balance shown afterwards is read from the chain, not
 * assumed from the call.
 */
function Faucet({ net, address }: { net: Net; address: `0x${string}` }) {
  const queryClient = useQueryClient();
  const [state, setState] = useState<"idle" | "asking" | "sent" | "failed">("idle");
  const [error, setError] = useState("");

  if (net.faucet.kind === "link") {
    return (
      <p className="lv-hint">
        Your wallet has no test {net.token.symbol}. Get some free from{" "}
        <a href={net.faucet.url} target="_blank" rel="noreferrer">
          {net.faucet.name} ↗
        </a>{" "}
        (choose {net.label}). {net.gasNote}
      </p>
    );
  }

  async function fund() {
    setState("asking");
    try {
      const r = await fetch(net.chain.rpcUrls.default.http[0], {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tempo_fundAddress", params: [address] }),
      });
      const j = (await r.json()) as { result?: unknown; error?: { message: string } };
      if (j.error) throw new Error(j.error.message);
      setState("sent");
      // The faucet answers before its transfers are mined; read the balance again shortly.
      for (const ms of [3000, 8000, 15000]) setTimeout(() => void queryClient.invalidateQueries(), ms);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setState("failed");
    }
  }

  return (
    <div className="lv-hint">
      <p>
        Your wallet has no test {net.token.symbol}. {net.label} has a faucet: it sends free test stablecoins to your wallet.{" "}
        {net.gasNote}
      </p>
      <p>
        <button type="button" className="btn btn-line ap-btn" onClick={fund} disabled={state === "asking" || state === "sent"}>
          {state === "asking" ? "Asking the faucet…" : state === "sent" ? "Sent: your balance updates in a few seconds" : `Get test ${net.token.symbol}`}
        </button>
      </p>
      {state === "failed" ? <p className="lv-err">The faucet refused: {error}</p> : null}
    </div>
  );
}
