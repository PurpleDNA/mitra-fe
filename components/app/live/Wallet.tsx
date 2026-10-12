"use client";

import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import { useState, type ReactNode } from "react";
import { useSwitchChain } from "wagmi";
import { NETWORKS } from "@/lib/chain/config";
import { usePrincipal, type TxState } from "@/lib/chain/hooks";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
export { short };

/** The top-bar wallet control, in the site's button styles. Opens RainbowKit's modals. */
export function WalletButton() {
  return (
    <ConnectButton.Custom>
      {({ account, chain: current, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        if (!mounted) return <span className="btn btn-line ap-btn" aria-hidden="true" style={{ visibility: "hidden" }}>Connect wallet</span>;
        if (!account || !current) {
          return (
            <button type="button" className="btn btn-dark ap-btn" onClick={openConnectModal}>
              Connect wallet
            </button>
          );
        }
        if (current.unsupported) {
          return (
            <button type="button" className="btn btn-line ap-btn" onClick={openChainModal}>
              Switch network
            </button>
          );
        }
        return (
          <span className="lv-wallet">
            <button type="button" className="btn btn-line ap-btn lv-net" onClick={openChainModal} title="Change network">
              {current.name} <span aria-hidden="true">▾</span>
            </button>
            <button type="button" className="btn btn-line ap-btn lv-acct" onClick={openAccountModal}>
              <span className="lv-dot" aria-hidden="true" />
              <span className="mono">{account.displayName}</span>
            </button>
          </span>
        );
      }}
    </ConnectButton.Custom>
  );
}

/** Renders its children only once a wallet is connected on the right chain; otherwise asks for that. */
export function ConnectFirst({ title, body, children }: { title: string; body: ReactNode; children: ReactNode }) {
  const { isConnected, onChain } = usePrincipal();
  const { openConnectModal } = useConnectModal();
  const { switchChain, isPending } = useSwitchChain();

  if (isConnected && onChain) return <>{children}</>;
  return (
    <div className="ap-empty">
      <span className="ap-empty-mark" aria-hidden="true">
        <span />
      </span>
      <h2>{isConnected ? "Pick a network Mitra runs on" : title}</h2>
      <p>
        {isConnected
          ? `Your wallet is on a network without a Mitra vault. Mitra runs on ${NETWORKS.map((n) => n.label).join(" and ")}, both test networks.`
          : body}
      </p>
      <div className="ap-actions">
        {isConnected ? (
          NETWORKS.map((n, i) => (
            <button
              key={n.key}
              type="button"
              className={`btn ${i === 0 ? "btn-dark" : "btn-line"} ap-btn`}
              disabled={isPending}
              onClick={() => switchChain({ chainId: n.chain.id })}
            >
              {isPending ? "Switching…" : `Switch to ${n.label}`}
            </button>
          ))
        ) : (
          <button type="button" className="btn btn-dark ap-btn" onClick={openConnectModal}>
            Connect wallet <span aria-hidden="true">→</span>
          </button>
        )}
      </div>
    </div>
  );
}

/** One line saying where a transaction is, with its explorer link. Says "failed" with the chain's reason. */
export function TxLine({ state }: { state: TxState }) {
  if (state.status === "idle") return null;
  const link =
    "hash" in state && state.hash ? (
      <a href={`${state.explorer}/tx/${state.hash}`} target="_blank" rel="noreferrer" className="mono">
        {short(state.hash)} ↗
      </a>
    ) : null;
  const text = {
    signing: `${state.label}: confirm in your wallet…`,
    pending: `${state.label}: waiting for the chain…`,
    done: `${state.label}: confirmed on chain.`,
    failed: `${state.label} failed: ${"error" in state ? state.error : ""}`,
  }[state.status];
  return (
    <div className={`lv-tx ${state.status}`} role="status">
      <p>
        {text} {link}
      </p>
      {state.status === "failed" && state.code ? <Audit rows={[["Contract reason", state.code]]} /> : null}
    </div>
  );
}

/** The evidence behind a plain-English line, folded away until someone asks for it. */
export function Audit({ rows, label = "Audit details" }: { rows: [string, ReactNode][]; label?: string }) {
  return (
    <details className="lv-audit">
      <summary>{label}</summary>
      <dl>
        {rows.map(([k, v]) => (
          <div key={k}>
            <dt>{k}</dt>
            <dd className="mono">{v}</dd>
          </div>
        ))}
      </dl>
    </details>
  );
}

/** Copies text, and says so for a moment. */
export function CopyButton({ text, label = "Copy" }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className="lv-copy"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text);
          setDone(true);
          setTimeout(() => setDone(false), 1600);
        } catch {
          // Clipboard blocked: the text is still on screen to select by hand.
        }
      }}
    >
      {done ? "Copied" : label}
    </button>
  );
}
