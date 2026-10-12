"use client";

import Link from "next/link";
import { useState } from "react";
import { isAddress } from "viem";
import { useMandates, usePrincipal, useSavedAgents, useTx, useVaultPosition, type SavedAgent } from "@/lib/chain/hooks";
import { AgentCard } from "./AgentCard";
import { ConnectFirst, TxLine } from "./Wallet";

/**
 * Agents and their limits. An agent is a wallet address you name; its limits are a
 * mandate opened in the vault contract from your wallet, naming Mitra's policy engine
 * as the only signer whose permits the vault will honour. The contract enforces the
 * budget, the expiry and revocation on every spend; the per-payment cap is enforced by
 * the engine when it issues a permit (engine ADR-0009). What the agent may pay for
 * (capabilities) is engine policy only: it is kept with the agent here and goes into
 * the engine's mandate through the Connect panel.
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
  const { agents, add, remove, update } = useSavedAgents(principal);
  const mandates = useMandates(
    principal,
    agents.map((a) => a.address),
  );
  const { position } = useVaultPosition(principal);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const tx = useTx();

  return (
    <>
      <RegisterForm
        principal={principal!}
        onAdd={(a) => {
          add(a);
          setJustAdded(a.address.toLowerCase());
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
              const key = a.address.toLowerCase();
              return (
                <AgentCard
                  key={key}
                  agent={a}
                  mandate={mandates.byHolder.get(key)}
                  loading={mandates.isLoading}
                  vault={position}
                  startOpen={justAdded === key ? "limits" : null}
                  onRemove={() => remove(a.address)}
                  onCapabilities={(capabilities) => update(a.address, { capabilities })}
                  tx={tx}
                  principal={principal!}
                />
              );
            })}
          </div>
          <TxLine state={tx.state} />
          <p className="ap-sub lv-small">
            The list of agents and their capabilities are kept in this browser; each agent’s limits, spend and status are read
            from the vault contract. The engine side is on <Link href={`/app/${ws}/developers`}>Developers</Link>.
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
