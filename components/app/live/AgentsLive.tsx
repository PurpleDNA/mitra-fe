"use client";

import Link from "next/link";
import { useState } from "react";
import { isAddress } from "viem";
import { POLICY_ENGINE, USDC, VAULT, VAULT_ABI, explorerAddress } from "@/lib/chain/config";
import {
  cleanAmount,
  parseAmount,
  toUsdc,
  useMandates,
  usePrincipal,
  useSavedAgents,
  useTx,
  type ChainMandate,
  type SavedAgent,
} from "@/lib/chain/hooks";
import { money } from "@/lib/app/workspaces";
import { ConnectFirst, TxLine, short } from "./Wallet";

/**
 * Agents and their limits. An agent is a wallet address you name; its limits are a
 * mandate opened in the vault contract from your wallet, naming Mitra's policy engine
 * as the only signer whose permits the vault will honour. The contract enforces the
 * budget, the expiry and revocation on every spend; the per-payment cap is enforced by
 * the engine when it issues a permit (engine ADR-0009).
 */
export function AgentsLive({ ws }: { ws: string }) {
  return (
    <ConnectFirst
      title="Connect your wallet to manage agents"
      body="Agents spend from your vault under limits you set from your wallet. Connect it to register an agent and give it limits."
    >
      <AgentsPanel ws={ws} />
    </ConnectFirst>
  );
}

function AgentsPanel({ ws }: { ws: string }) {
  const { principal } = usePrincipal();
  const { agents, add, remove } = useSavedAgents(principal);
  const mandates = useMandates(
    principal,
    agents.map((a) => a.address),
  );
  const [open, setOpen] = useState<string | null>(null);
  const tx = useTx();

  return (
    <>
      <RegisterForm
        principal={principal!}
        onAdd={(a) => {
          add(a);
          setOpen(a.address.toLowerCase());
        }}
        first={agents.length === 0}
      />

      {agents.length > 0 ? (
        <section className="ap-sec" aria-labelledby="ag-list">
          <h2 id="ag-list" className="ap-h2">
            Your agents · {agents.length}
          </h2>
          <div className="lv-agents">
            {agents.map((a) => {
              const m = mandates.byHolder.get(a.address.toLowerCase());
              const key = a.address.toLowerCase();
              return (
                <AgentRow
                  key={key}
                  agent={a}
                  mandate={m}
                  loading={mandates.isLoading}
                  editing={open === key}
                  onEdit={() => setOpen(open === key ? null : key)}
                  onRemove={() => remove(a.address)}
                  tx={tx}
                  principal={principal!}
                />
              );
            })}
          </div>
          <TxLine state={tx.state} />
          <p className="ap-sub lv-small">
            The list of agents is kept in this browser; each agent’s limits, spend and status are read from the vault contract.
            Next: <Link href={`/app/${ws}/developers#connect`}>connect the agent to Mitra</Link>.
          </p>
        </section>
      ) : null}
    </>
  );
}

function RegisterForm({ principal, onAdd, first }: { principal: `0x${string}`; onAdd: (a: Omit<SavedAgent, "addedAt">) => void; first: boolean }) {
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const bad = address.length > 0 && !isAddress(address);
  const self = isAddress(address) && address.toLowerCase() === principal.toLowerCase();
  return (
    <form
      className="lv-card lv-register"
      onSubmit={(e) => {
        e.preventDefault();
        if (!isAddress(address) || !name.trim()) return;
        onAdd({ name: name.trim(), address: address as `0x${string}` });
        setName("");
        setAddress("");
      }}
    >
      <div>
        <h2>{first ? "Register your first agent" : "Register another agent"}</h2>
        <p>
          The agent’s own wallet: the address it signs with. Use a separate wallet from yours, so the agent never holds the key
          that owns the vault.
        </p>
      </div>
      <div className="lv-fields">
        <label className="lv-field">
          <span className="tag">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Research agent" maxLength={48} />
        </label>
        <label className="lv-field lv-wide">
          <span className="tag">Agent wallet address</span>
          <input value={address} onChange={(e) => setAddress(e.target.value.trim())} placeholder="0x…" className="mono" spellCheck={false} />
        </label>
        <button type="submit" className="btn btn-dark ap-btn" disabled={!name.trim() || !isAddress(address)}>
          Register <span aria-hidden="true">→</span>
        </button>
      </div>
      {bad ? <p className="lv-err">That isn’t a wallet address.</p> : null}
      {self ? <p className="lv-hint">That is your own wallet. It works for a test, but a real agent should have its own key.</p> : null}
    </form>
  );
}

type Status = "loading" | "no-limits" | "active" | "revoked" | "expired" | "other-engine";

function statusOf(m: ChainMandate | null | undefined, loading: boolean): Status {
  if (m === undefined) return loading ? "loading" : "no-limits";
  if (m === null) return "no-limits";
  if (m.revoked) return "revoked";
  if (Number(m.expiresAt) * 1000 <= Date.now()) return "expired";
  if (m.policyEngine.toLowerCase() !== POLICY_ENGINE.toLowerCase()) return "other-engine";
  return "active";
}

const STATUS: Record<Status, { label: string; cls: string }> = {
  loading: { label: "Reading…", cls: "" },
  "no-limits": { label: "No limits", cls: "hold" },
  active: { label: "Active", cls: "paid" },
  revoked: { label: "Revoked", cls: "stop" },
  expired: { label: "Expired", cls: "hold" },
  "other-engine": { label: "Other engine", cls: "hold" },
};

function AgentRow({
  agent,
  mandate,
  loading,
  editing,
  onEdit,
  onRemove,
  tx,
  principal,
}: {
  agent: SavedAgent;
  mandate: ChainMandate | null | undefined;
  loading: boolean;
  editing: boolean;
  onEdit: () => void;
  onRemove: () => void;
  tx: ReturnType<typeof useTx>;
  principal: `0x${string}`;
}) {
  const status = statusOf(mandate, loading);
  const s = STATUS[status];
  const m = mandate ?? null;
  const left = m ? m.ceiling - m.spent : 0n;

  async function revoke() {
    if (!confirm(`Revoke ${agent.name}’s limits? This is permanent: the vault refuses every payment for this agent from now on, including ones already approved.`)) return;
    await tx.send(`Revoke ${agent.name}`, { address: VAULT, abi: VAULT_ABI, functionName: "revokeMandate", args: [principal, agent.address, USDC.address] });
  }

  return (
    <article className="lv-agent">
      <header>
        <div>
          <h3>{agent.name}</h3>
          <a href={explorerAddress(agent.address)} target="_blank" rel="noreferrer" className="mono ap-meta">
            {short(agent.address)} ↗
          </a>
        </div>
        <span className={`ap-chip ${s.cls}`}>{s.label}</span>
      </header>

      {m ? (
        <dl className="lv-limits">
          <div>
            <dt className="tag">Per payment</dt>
            <dd>{money(toUsdc(m.limit))}</dd>
          </div>
          <div>
            <dt className="tag">Budget</dt>
            <dd>{money(toUsdc(m.ceiling))}</dd>
          </div>
          <div>
            <dt className="tag">Spent</dt>
            <dd>{money(toUsdc(m.spent))}</dd>
          </div>
          <div>
            <dt className="tag">Left</dt>
            <dd>{money(toUsdc(left))}</dd>
          </div>
          <div>
            <dt className="tag">Ends</dt>
            <dd>{new Date(Number(m.expiresAt) * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</dd>
          </div>
          <div>
            <dt className="tag">Version</dt>
            <dd>v{m.version}</dd>
          </div>
        </dl>
      ) : null}

      {status === "other-engine" ? (
        <p className="lv-hint">
          These limits name a different policy engine ({short(m!.policyEngine)}), so Mitra cannot approve payments under them.
        </p>
      ) : null}
      {status === "revoked" ? (
        <p className="lv-hint">Revoked limits are final. To let this work go on, register the agent with a new wallet.</p>
      ) : null}
      {status === "expired" ? (
        <p className="lv-hint">
          These limits have ended and the vault refuses every payment under them. The contract can’t reopen limits for the same
          wallet, so give the agent a new wallet and register that.
        </p>
      ) : null}

      <div className="ap-actions">
        {status === "no-limits" || status === "active" ? (
          <button type="button" className={`btn ${status === "no-limits" ? "btn-dark" : "btn-line"} ap-btn`} onClick={onEdit} disabled={tx.busy}>
            {status === "no-limits" ? "Set its limits" : "Change limits"}
          </button>
        ) : null}
        {status === "active" ? (
          <button type="button" className="btn btn-line ap-btn" onClick={revoke} disabled={tx.busy}>
            <span className="ap-dot-stop" aria-hidden="true" />
            Revoke
          </button>
        ) : null}
        {status === "no-limits" || status === "revoked" || status === "expired" ? (
          <button type="button" className="lv-link" onClick={onRemove}>
            Remove from list
          </button>
        ) : null}
      </div>

      {editing && (status === "no-limits" || status === "active") ? (
        <LimitsForm agent={agent} existing={status === "no-limits" ? null : m} tx={tx} onDone={onEdit} />
      ) : null}
    </article>
  );
}

function LimitsForm({
  agent,
  existing,
  tx,
  onDone,
}: {
  agent: SavedAgent;
  existing: ChainMandate | null;
  tx: ReturnType<typeof useTx>;
  onDone: () => void;
}) {
  const [perPayment, setPerPayment] = useState(existing ? String(toUsdc(existing.limit)) : "");
  const [budget, setBudget] = useState(existing ? String(toUsdc(existing.ceiling)) : "");
  const [days, setDays] = useState("30");

  const limit = parseAmount(perPayment);
  const ceiling = parseAmount(budget);
  const d = Number(days);
  const daysOk = Number.isInteger(d) && d >= 1 && d <= 365;
  const order = limit !== null && ceiling !== null && ceiling < limit;
  const belowSpent = existing && ceiling !== null && ceiling < existing.spent;
  const ok = limit !== null && ceiling !== null && daysOk && !order && !belowSpent;

  async function submit() {
    if (!ok) return;
    const expiresAt = BigInt(Math.floor(Date.now() / 1000) + d * 86400);
    const done = existing
      ? await tx.send(`Change ${agent.name}’s limits`, {
          address: VAULT,
          abi: VAULT_ABI,
          functionName: "amendMandate",
          args: [agent.address, USDC.address, limit!, ceiling!, expiresAt],
        })
      : await tx.send(`Open ${agent.name}’s limits`, {
          address: VAULT,
          abi: VAULT_ABI,
          functionName: "openMandate",
          args: [agent.address, USDC.address, limit!, ceiling!, expiresAt, POLICY_ENGINE],
        });
    if (done) onDone();
  }

  return (
    <form
      className="lv-limits-form"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="lv-fields">
        <label className="lv-field">
          <span className="tag">Most per payment ({USDC.symbol})</span>
          <input inputMode="decimal" value={perPayment} onChange={(e) => setPerPayment(cleanAmount(e.target.value))} placeholder="5.00" />
        </label>
        <label className="lv-field">
          <span className="tag">Total budget ({USDC.symbol})</span>
          <input inputMode="decimal" value={budget} onChange={(e) => setBudget(cleanAmount(e.target.value))} placeholder="20.00" />
        </label>
        <label className="lv-field">
          <span className="tag">Ends in (days)</span>
          <input inputMode="numeric" value={days} onChange={(e) => setDays(e.target.value.replace(/\D/g, ""))} />
        </label>
      </div>
      {order ? <p className="lv-err">The budget can’t be smaller than one payment.</p> : null}
      {belowSpent ? <p className="lv-err">The budget can’t go below what the agent has already spent.</p> : null}
      {!daysOk && days ? <p className="lv-err">Between 1 and 365 days.</p> : null}
      <p className="lv-hint">
        {existing
          ? "Changing limits applies to payments approved from now on. One already approved under the old limits still stands; to stop those too, revoke."
          : `Opened in the vault contract from your wallet. Only Mitra’s policy engine (${short(POLICY_ENGINE)}) can approve a payment under these limits, and the agent can’t change them.`}
      </p>
      <div className="ap-actions">
        <button type="submit" className="btn btn-dark ap-btn" disabled={!ok || tx.busy}>
          {existing ? "Save new limits" : "Open limits"} <span aria-hidden="true">→</span>
        </button>
        <button type="button" className="btn btn-line ap-btn" onClick={onDone}>
          Cancel
        </button>
      </div>
    </form>
  );
}
