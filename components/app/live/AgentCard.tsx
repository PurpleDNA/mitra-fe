"use client";

import { useState, type KeyboardEvent } from "react";
import { Pips } from "@/components/app/Blocks";
import { money } from "@/lib/app/workspaces";
import { POLICY_ENGINE, VAULT_ABI, explorerAddress } from "@/lib/chain/config";
import { dryRun, ENGINE_DEFAULT_CAPABILITIES, type DryRun } from "@/lib/chain/dryrun";
import { cleanAmount, parseAmount, toUnits, useNet, useTx, type ChainMandate, type SavedAgent } from "@/lib/chain/hooks";
import { engineAgentId } from "@/lib/engine/request";
import { EngineSync } from "./EngineSync";
import { Audit, CopyButton, short } from "./Wallet";

type Status = "loading" | "no-limits" | "active" | "revoked" | "expired" | "other-engine";
type Panel = "limits" | "capabilities" | "try" | "connect";

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

const date = (s: bigint) => new Date(Number(s) * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/**
 * One agent as a spend card: who holds it, how much headroom is left, the cap per
 * payment and what it may pay for. Everything money-shaped is read from the vault
 * contract; capabilities are engine policy, saved to the account.
 */
export function AgentCard({
  agent,
  mandate,
  loading,
  vault,
  startOpen,
  onRemove,
  onCapabilities,
  tx,
  principal,
}: {
  agent: SavedAgent;
  mandate: ChainMandate | null | undefined;
  loading: boolean;
  vault: { available: bigint; emergencyFreeze: boolean } | undefined;
  startOpen: Panel | null;
  onRemove: () => void;
  onCapabilities: (c: string[]) => void;
  tx: ReturnType<typeof useTx>;
  principal: `0x${string}`;
}) {
  const net = useNet();
  const status = statusOf(mandate, loading);
  const s = STATUS[status];
  const m = mandate ?? null;
  const [panel, setPanel] = useState<Panel | null>(startOpen);
  const toggle = (p: Panel) => setPanel(panel === p ? null : p);
  const caps = agent.capabilities ?? [];
  const canSetLimits = status === "no-limits" || status === "active";
  const left = m ? m.ceiling - m.spent : 0n;
  const usedPct = m && m.ceiling > 0n ? Number((m.spent * 1000n) / m.ceiling) / 10 : 0;

  async function revoke() {
    if (!confirm(`Revoke ${agent.name}’s card? This is permanent: the vault refuses every payment for this agent from now on, including ones already approved.`)) return;
    await tx.send(`Revoke ${agent.name}`, { address: net.vault, abi: VAULT_ABI, functionName: "revokeMandate", args: [principal, agent.address, net.token.address] });
  }

  return (
    <article className={`lv-sc ${status}`}>
      <div className="lv-sc-face">
        <header className="lv-sc-top">
          <span className="tag">Spend card · {net.token.symbol} · {net.label}</span>
          <span className={`ap-chip ${s.cls}`}>{s.label}</span>
        </header>
        <div className="lv-sc-who">
          <h3>{agent.name}</h3>
          <a href={explorerAddress(net, agent.address)} target="_blank" rel="noreferrer" className="mono ap-meta">
            {short(agent.address)} ↗
          </a>
        </div>

        {m ? (
          <>
            <div className="lv-sc-head">
              <span className="lv-sc-left">{money(toUnits(left))}</span>
              <span className="ap-meta">left of {money(toUnits(m.ceiling))} budget</span>
            </div>
            <div className="lv-bar" role="img" aria-label={`${usedPct}% of the budget spent`}>
              <span style={{ width: `${Math.min(100, usedPct)}%` }} />
            </div>
            <dl className="lv-sc-facts">
              <div>
                <dt className="tag">Per payment</dt>
                <dd>{money(toUnits(m.limit))}</dd>
              </div>
              <div>
                <dt className="tag">Spent</dt>
                <dd>{money(toUnits(m.spent))}</dd>
              </div>
              <div>
                <dt className="tag">Ends</dt>
                <dd>{date(m.expiresAt)}</dd>
              </div>
              <div>
                <dt className="tag">Version</dt>
                <dd>v{m.version}</dd>
              </div>
            </dl>
          </>
        ) : (
          <p className="lv-hint">{loading ? "Reading its limits from the vault…" : "No limits yet. Until you set them, this agent can’t spend anything."}</p>
        )}

        <div className="lv-sc-caps">
          <span className="tag">May pay for</span>
          {(caps.length ? caps : ENGINE_DEFAULT_CAPABILITIES).map((c) => (
            <span key={c} className="lv-chip">
              {c}
            </span>
          ))}
          {caps.length ? null : <span className="ap-meta">engine default</span>}
        </div>
      </div>

      {status === "other-engine" ? (
        <p className="lv-hint">These limits name a different policy engine ({short(m!.policyEngine)}), so Mitra cannot approve payments under them.</p>
      ) : null}
      {status === "revoked" ? <p className="lv-hint">Revoked cards are final. To let this work go on, register the agent with a new wallet.</p> : null}
      {status === "expired" ? (
        <p className="lv-hint">
          This card has ended and the vault refuses every payment under it. The contract can’t reopen limits for the same wallet, so give
          the agent a new wallet and register that.
        </p>
      ) : null}

      <EngineSync agent={agent} mandate={m} principal={principal} active={status === "active"} />

      <div className="lv-sc-tabs" role="toolbar" aria-label={`${agent.name} actions`}>
        {canSetLimits ? (
          <button type="button" aria-pressed={panel === "limits"} onClick={() => toggle("limits")}>
            {status === "no-limits" ? "Set its limits" : "Change limits"}
          </button>
        ) : null}
        <button type="button" aria-pressed={panel === "capabilities"} onClick={() => toggle("capabilities")}>
          Capabilities
        </button>
        <button type="button" aria-pressed={panel === "try"} onClick={() => toggle("try")}>
          Try it
        </button>
        <button type="button" aria-pressed={panel === "connect"} onClick={() => toggle("connect")}>
          Connect
        </button>
        <span className="lv-sc-gap" />
        {status === "active" ? (
          <button type="button" className="lv-revoke" onClick={revoke} disabled={tx.busy}>
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

      {panel === "limits" && canSetLimits ? (
        <LimitsForm agent={agent} existing={status === "no-limits" ? null : m} tx={tx} onDone={() => setPanel(null)} />
      ) : null}
      {panel === "capabilities" ? (
        <CapabilitiesEditor
          value={caps}
          onSave={(c) => {
            onCapabilities(c);
            setPanel(null);
          }}
        />
      ) : null}
      {panel === "try" ? <TryIt mandate={m} vault={vault} capabilities={caps} /> : null}
      {panel === "connect" ? <ConnectPanel agent={agent} mandate={m} principal={principal} /> : null}
    </article>
  );
}

const PRESETS = ["research", "payment", "data_indexing"];
const normalise = (t: string) =>
  t
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9_.:-]/g, "")
    .slice(0, 40);

/** Preset chips plus free typing: Enter or a comma turns what you typed into a tag. */
function CapabilitiesEditor({ value, onSave }: { value: string[]; onSave: (c: string[]) => void }) {
  // Start from what the engine would actually apply: an agent with none saved runs on the
  // engine's defaults, so editing must begin there, not from an empty list.
  const [tags, setTags] = useState<string[]>(value.length ? value : ENGINE_DEFAULT_CAPABILITIES);
  const [draft, setDraft] = useState("");
  const addTag = (raw: string) => {
    const t = normalise(raw);
    if (t && !tags.includes(t)) setTags([...tags, t]);
    setDraft("");
  };
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(draft);
    } else if (e.key === "Backspace" && !draft && tags.length) {
      setTags(tags.slice(0, -1));
    }
  };
  return (
    <div className="lv-panel">
      <p className="lv-hint">
        What this agent may pay for. The engine refuses any payment for something not on this list
        (<span className="mono">CAPABILITY_NOT_ALLOWED</span>). Left empty, the engine uses its default: {ENGINE_DEFAULT_CAPABILITIES.join(", ")}.
      </p>
      <div className="lv-presets">
        {PRESETS.map((p) => {
          const on = tags.includes(p);
          return (
            <button key={p} type="button" className={`lv-chip lv-chip-btn${on ? " on" : ""}`} aria-pressed={on} onClick={() => setTags(on ? tags.filter((t) => t !== p) : [...tags, p])}>
              {on ? "✓ " : "+ "}
              {p}
            </button>
          );
        })}
      </div>
      <label className="lv-tags">
        {tags
          .filter((t) => !PRESETS.includes(t))
          .map((t) => (
            <span key={t} className="lv-chip on">
              {t}
              <button type="button" aria-label={`Remove ${t}`} onClick={() => setTags(tags.filter((x) => x !== t))}>
                ×
              </button>
            </span>
          ))}
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
          onBlur={() => draft && addTag(draft)}
          placeholder="Type one, e.g. seo-audit, then Enter"
          aria-label="Add a capability"
        />
      </label>
      {!tags.includes("payment") ? (
        <p className="lv-err">
          Without <span className="mono">payment</span> the engine can’t settle this agent’s agreements, so it can’t pay for
          anything. Keep it unless that is what you want.
        </p>
      ) : null}
      <p className="lv-hint">
        Saved to your account. The engine only learns them when you send its rules (Connect → step 2), and the vault
        contract never sees them.
      </p>
      <div className="ap-actions">
        <button type="button" className="btn btn-dark ap-btn" onClick={() => onSave(tags)}>
          Save capabilities
        </button>
      </div>
    </div>
  );
}

/**
 * A dry run: the user picks an amount and a capability, and sees which check would stop
 * it and why. Evaluated in the browser (lib/chain/dryrun.ts); nothing is signed or sent.
 */
function TryIt({
  mandate,
  vault,
  capabilities,
}: {
  mandate: ChainMandate | null;
  vault: { available: bigint; emergencyFreeze: boolean } | undefined;
  capabilities: string[];
}) {
  const net = useNet();
  const allowed = capabilities.length ? capabilities : ENGINE_DEFAULT_CAPABILITIES;
  const [amount, setAmount] = useState("");
  const [capability, setCapability] = useState(allowed[0]);
  const [result, setResult] = useState<{ run: DryRun; amount: string; capability: string } | null>(null);

  const run = (amt: bigint, cap: string) => {
    setAmount(String(toUnits(amt)));
    setCapability(cap);
    setResult({ run: dryRun({ mandate, vault, capabilities, amount: amt, capability: cap }), amount: String(toUnits(amt)), capability: cap });
  };

  const unit = 10n ** BigInt(net.token.decimals);
  const cap = mandate?.limit ?? 20n * unit;
  const overspend = cap * 3n;
  const headroom = mandate ? mandate.ceiling - mandate.spent : 0n;
  const valid = [cap, headroom, vault?.available ?? 0n].reduce((a, b) => (b < a ? b : a));

  return (
    <div className="lv-panel">
      <p className="lv-hint">
        <b>A dry run, not a payment.</b> It checks a pretend request against this agent’s real limits and your vault, read from the chain.
        Nothing is signed and nothing is sent.
      </p>
      <div className="ap-actions">
        <button type="button" className="btn btn-line ap-btn" onClick={() => run(overspend, allowed[0])}>
          <span className="ap-dot-stop" aria-hidden="true" />
          Try an overspend ({money(toUnits(overspend))})
        </button>
        <button type="button" className="btn btn-line ap-btn" onClick={() => run(valid > 0n ? valid : unit, allowed[0])}>
          Try a valid task ({money(toUnits(valid > 0n ? valid : unit))})
        </button>
      </div>
      <form
        className="lv-fields"
        onSubmit={(e) => {
          e.preventDefault();
          const a = parseAmount(amount);
          if (a) run(a, normalise(capability));
        }}
      >
        <label className="lv-field">
          <span className="tag">Amount ({net.token.symbol})</span>
          <input inputMode="decimal" value={amount} onChange={(e) => setAmount(cleanAmount(e.target.value))} placeholder="15.00" />
        </label>
        <label className="lv-field">
          <span className="tag">For (capability)</span>
          <input value={capability} onChange={(e) => setCapability(e.target.value)} list="lv-caps" />
          <datalist id="lv-caps">
            {allowed.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </label>
        <button type="submit" className="btn btn-dark ap-btn" disabled={!parseAmount(amount)}>
          Check it
        </button>
      </form>

      {result ? (
        <div className={`lv-verdict ${result.run.allowed ? "ok" : "stop"}`} role="status">
          <div className="lv-verdict-h">
            <Pips checks={result.run.checks} />
            <span className="tag">Budget · Rules · Exact match</span>
          </div>
          <p className="lv-verdict-t">{result.run.headline}</p>
          {result.run.reasons.length > 1 ? (
            <ul>
              {result.run.reasons.slice(1).map((r) => (
                <li key={r.code}>Also: {r.text}</li>
              ))}
            </ul>
          ) : null}
          <p className="lv-hint">
            {result.run.allowed
              ? "In a real payment the engine would now sign a permit for this exact payment, and the vault would check it again before any money moved. The third check, exact match, happens then; a dry run never gets that far."
              : "In a real payment the request would stop here: the engine signs nothing, and the vault would refuse it even if it did."}
          </p>
          <Audit
            rows={[
              ["Request", `${result.amount} ${net.token.symbol} for "${result.capability}"`],
              ["Decision", result.run.allowed ? "ALLOW (dry run)" : "DENY (dry run)"],
              ...result.run.reasons.map((r): [string, string] => [r.where, r.code]),
              ["Limits read from", `${short(net.vault)} mandates(principal, holder, token)`],
            ]}
          />
        </div>
      ) : null}
    </div>
  );
}

/** The engine's public address, for the snippets an agent runs. */
const ENGINE_URL = process.env.NEXT_PUBLIC_MITRA_ENGINE_URL || "https://mitra-engine.fly.dev";

/** The agent's side, prefilled for this agent, each ready to copy. Your side is the Sync button on the card. */
function ConnectPanel({ agent, principal }: { agent: SavedAgent; mandate: ChainMandate | null; principal: `0x${string}` }) {
  const net = useNet();
  const agentId = engineAgentId(agent.name, agent.address);
  const caps = agent.capabilities?.length ? agent.capabilities : ENGINE_DEFAULT_CAPABILITIES;

  const register = `// Run by the agent, with ITS key (${short(agent.address)}), not yours.
// Not needed for a wallet generated in this app: that one registered itself.
import { MitraClient } from "../mitra/lib/sdk";
import { privateKeyToAccount } from "viem/accounts";

const wallet = privateKeyToAccount(process.env.AGENT_KEY as \`0x\${string}\`);
const mitra = new MitraClient({
  baseUrl: "${ENGINE_URL}",
  agentId: "${agentId}",
  chainId: ${net.chain.id},
  signer: { address: wallet.address, signTypedData: (t) => wallet.signTypedData(t) },
});

await mitra.agents.register({
  name: ${JSON.stringify(agent.name)},
  owner: "${principal}",
  capabilities: ${JSON.stringify(caps)},
  chain: "${net.key}",
});`;

  const mcp = JSON.stringify(
    { mcpServers: { mitra: { command: "node", args: ["/path/to/mitra/bin/mitra-mcp.mjs"], env: { MITRA_API_URL: ENGINE_URL } } } },
    null,
    2,
  );

  return (
    <div className="lv-panel">
      <p className="lv-hint">
        Three steps get this agent paying: it is registered with the engine as <span className="mono">{agentId}</span>, you sync its
        card (the <b>Sync with Mitra</b> button above: your wallet signs, the engine reads your limits from the chain), and the agent
        talks to Mitra over MCP or the SDK. The engine is at <span className="mono">{ENGINE_URL}</span>.
      </p>
      {[
        ["1 · The agent registers itself (pasted wallets only)", register],
        ["2 · Point the agent at Mitra (MCP)", mcp],
      ].map(([title, code]) => (
        <div key={title} className="lv-snip">
          <div className="lv-snip-h">
            <span className="tag">{title}</span>
            <CopyButton text={code} />
          </div>
          <pre className="ap-code">{code}</pre>
        </div>
      ))}
      <p className="lv-hint">
        Once synced, the engine pays this agent’s accepted agreements from your vault, never more than the card allows: the vault
        contract checks the budget, end date and revocation on every payment.
      </p>
    </div>
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
  const net = useNet();
  const [perPayment, setPerPayment] = useState(existing ? String(toUnits(existing.limit)) : "");
  const [budget, setBudget] = useState(existing ? String(toUnits(existing.ceiling)) : "");
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
          address: net.vault,
          abi: VAULT_ABI,
          functionName: "amendMandate",
          args: [agent.address, net.token.address, limit!, ceiling!, expiresAt],
        })
      : await tx.send(`Open ${agent.name}’s limits`, {
          address: net.vault,
          abi: VAULT_ABI,
          functionName: "openMandate",
          args: [agent.address, net.token.address, limit!, ceiling!, expiresAt, POLICY_ENGINE],
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
          <span className="tag">Most per payment ({net.token.symbol})</span>
          <input inputMode="decimal" value={perPayment} onChange={(e) => setPerPayment(cleanAmount(e.target.value))} placeholder="5.00" />
        </label>
        <label className="lv-field">
          <span className="tag">Total budget ({net.token.symbol})</span>
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
