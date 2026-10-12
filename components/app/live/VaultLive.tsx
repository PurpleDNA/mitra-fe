"use client";

import { useState } from "react";
import { ERC20_ABI, explorerAddress, FAUCET_URL, USDC, VAULT, VAULT_ABI, chain } from "@/lib/chain/config";
import { cleanAmount as clean, parseAmount as parse, toUsdc, usePrincipal, useTx, useVaultPosition, useWalletUsdc } from "@/lib/chain/hooks";
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
      body={`Your vault is your position in Mitra’s vault contract on ${chain.name}, keyed by your wallet. Only that wallet can withdraw from it or give agents limits.`}
    >
      <VaultPanel />
    </ConnectFirst>
  );
}

function VaultPanel() {
  const { principal } = usePrincipal();
  const { position, isLoading } = useVaultPosition(principal);
  const wallet = useWalletUsdc(principal);
  const tx = useTx();
  const [dep, setDep] = useState("");
  const [wd, setWd] = useState("");

  const held = position ? position.reserved + position.escrowed + position.encumbered + position.settling + position.frozen : 0n;
  const hasVault = (position?.total ?? 0n) > 0n;

  async function deposit() {
    const amount = parse(dep);
    if (!amount || !principal) return;
    if ((wallet.allowance ?? 0n) < amount) {
      const ok = await tx.send(`Allow the vault to take ${dep} ${USDC.symbol}`, {
        address: USDC.address,
        abi: ERC20_ABI,
        functionName: "approve",
        args: [VAULT, amount],
      });
      if (!ok) return;
    }
    const ok = await tx.send(`Deposit ${dep} ${USDC.symbol}`, { address: VAULT, abi: VAULT_ABI, functionName: "deposit", args: [USDC.address, amount] });
    if (ok) setDep("");
  }

  async function withdraw() {
    const amount = parse(wd);
    if (!amount || !principal) return;
    const ok = await tx.send(`Withdraw ${wd} ${USDC.symbol}`, {
      address: VAULT,
      abi: VAULT_ABI,
      functionName: "withdraw",
      args: [USDC.address, amount, principal],
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
          <span className="ap-stat-v">{isLoading ? "…" : money(toUsdc(position?.available))}</span>
          <span className="ap-stat-n">{USDC.symbol} · {chain.name}</span>
        </div>
        <div className="ap-stat">
          <span className="tag">Held</span>
          <span className="ap-stat-v">{isLoading ? "…" : money(toUsdc(held))}</span>
          <span className="ap-stat-n">Reserved, in escrow or settling</span>
        </div>
        <div className="ap-stat tinted">
          <span className="tag">In the vault</span>
          <span className="ap-stat-v">{isLoading ? "…" : money(toUsdc(position?.total))}</span>
          <span className="ap-stat-n">{position?.emergencyFreeze ? "Paused: nothing can leave" : "Total, all positions"}</span>
        </div>
        <div className="ap-stat">
          <span className="tag">In your wallet</span>
          <span className="ap-stat-v">{wallet.isLoading ? "…" : money(toUsdc(wallet.balance))}</span>
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
            Moves {USDC.symbol} from your wallet into the vault. The first time, your wallet asks twice: once to let the vault take
            the amount, once to deposit it.
          </p>
          <label className="lv-field">
            <span className="tag">Amount ({USDC.symbol})</span>
            <span className="lv-row">
              <input inputMode="decimal" placeholder="10.00" value={dep} onChange={(e) => setDep(clean(e.target.value))} />
              <button type="button" className="lv-max" onClick={() => setDep(String(toUsdc(wallet.balance)))}>
                Max
              </button>
            </span>
          </label>
          {depTooMuch ? <p className="lv-err">That is more than your wallet holds.</p> : null}
          {wallet.balance === 0n ? (
            <p className="lv-hint">
              Your wallet has no test {USDC.symbol}. Get some free from{" "}
              <a href={FAUCET_URL} target="_blank" rel="noreferrer">
                Circle’s faucet ↗
              </a>{" "}
              (choose {chain.name}). You also need a little test ETH for gas.
            </p>
          ) : null}
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
            <span className="tag">Amount ({USDC.symbol})</span>
            <span className="lv-row">
              <input inputMode="decimal" placeholder="0.00" value={wd} onChange={(e) => setWd(clean(e.target.value))} />
              <button type="button" className="lv-max" onClick={() => setWd(String(toUsdc(position?.available)))}>
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
            <a href={explorerAddress(VAULT)} target="_blank" rel="noreferrer" className="mono">
              {short(VAULT)} ↗
            </a>
          </dd>
        </div>
        <div>
          <dt className="tag">Owner (you)</dt>
          <dd className="mono">{principal ? short(principal) : "—"}</dd>
        </div>
        <div>
          <dt className="tag">Network</dt>
          <dd>{chain.name} · test network</dd>
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
