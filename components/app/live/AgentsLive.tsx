"use client";

import Link from "next/link";
import { useState } from "react";
import { isAddress } from "viem";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { useMandates, usePrincipal, useSavedAgents, useTx, useVaultPosition, type SavedAgent } from "@/lib/chain/hooks";
import { AgentCard } from "./AgentCard";
import { ConnectFirst, CopyButton, TxLine } from "./Wallet";

/**
 * Agents and their limits. An agent is a wallet address you name; its limits are a
 * mandate opened in the vault contract from your wallet, naming Mitra's policy engine
 * as the only signer whose permits the vault will honour. The contract enforces the
 * budget, the expiry and revocation on every spend; the per-payment cap is enforced by
 * the engine when it issues a permit (engine ADR-0009). What the agent may pay for
 * (capabilities) is engine policy only: it is saved to the account and goes into
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
  const { agents, error, add, remove, update } = useSavedAgents(principal);
  const mandates = useMandates(
    principal,
    agents.map((a) => a.address),
  );
  const { position } = useVaultPosition(principal);
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const tx = useTx();

  return (
    <>
      {error ? (
        <p className="lv-note stop" role="alert">
          {error}
        </p>
      ) : null}
      <RegisterForm
        principal={principal!}
        onAdd={(a) => {
          void add(a);
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
                  onRemove={() => void remove(a.address)}
                  onCapabilities={(capabilities) => void update(a.address, { capabilities })}
                  tx={tx}
                  principal={principal!}
                />
              );
            })}
          </div>
          <TxLine state={tx.state} />
          <p className="ap-sub lv-small">
            Your agents and their capabilities are saved to your account; each agent’s limits, spend and status are read
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
  // A key generated here is shown once, so the person can hand it to the agent. It is
  // never stored or sent: it lives in this component's state until the form resets.
  const [generated, setGenerated] = useState<{ address: string; key: string } | null>(null);
  const [saved, setSaved] = useState(false);
  const bad = address.length > 0 && !isAddress(address);
  const self = isAddress(address) && address.toLowerCase() === principal.toLowerCase();
  const usingGenerated = generated !== null && generated.address === address;
  const ready = name.trim() && isAddress(address) && (!usingGenerated || saved);

  function generate() {
    const key = generatePrivateKey();
    const a = privateKeyToAccount(key).address;
    setGenerated({ address: a, key });
    setSaved(false);
    setAddress(a);
  }

  return (
    <form
      className="lv-card lv-register"
      onSubmit={(e) => {
        e.preventDefault();
        if (!ready) return;
        onAdd({ name: name.trim(), address: address as `0x${string}` });
        setName("");
        setAddress("");
        setGenerated(null);
        setSaved(false);
      }}
    >
      <div>
        <h2>{first ? "Register your first agent" : "Register another agent"}</h2>
        <p>
          Every agent signs with its own wallet, separate from yours, so it never holds the key that owns the vault. Paste the address
          of the key your agent already uses, or generate a new one here.
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
        <button type="button" className="btn btn-line ap-btn" onClick={generate}>
          {generated ? "Generate another" : "Generate an agent wallet"}
        </button>
      </div>

      {usingGenerated ? (
        <div className="lv-keybox" role="group" aria-label="New agent key">
          <p>
            <b>Your agent’s private key. It is shown once.</b> Copy it into the agent’s environment as{" "}
            <span className="mono">AGENT_KEY</span>. Mitra doesn’t keep it: close this page without copying and it’s gone. Test networks
            only; a key shown in a web page isn’t how to hold real money.
          </p>
          <div className="lv-keyrow">
            <code className="mono">{generated!.key}</code>
            <CopyButton text={generated!.key} label="Copy key" />
          </div>
          <label className="lv-check">
            <input type="checkbox" checked={saved} onChange={(e) => setSaved(e.target.checked)} />
            I’ve saved the key somewhere safe
          </label>
        </div>
      ) : null}

      {bad ? <p className="lv-err">That isn’t a wallet address.</p> : null}
      {self ? <p className="lv-hint">That is your own wallet. It works for a test, but a real agent should have its own key.</p> : null}
      <button type="submit" className="btn btn-dark ap-btn" disabled={!ready}>
        Register <span aria-hidden="true">→</span>
      </button>
    </form>
  );
}
