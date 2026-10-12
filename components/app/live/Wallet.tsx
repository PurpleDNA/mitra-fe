"use client";

import { ConnectButton, useConnectModal } from "@rainbow-me/rainbowkit";
import type { ReactNode } from "react";
import { useSwitchChain } from "wagmi";
import { chain, explorerTx } from "@/lib/chain/config";
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
              Switch to {chain.name}
            </button>
          );
        }
        return (
          <button type="button" className="btn btn-line ap-btn lv-acct" onClick={openAccountModal}>
            <span className="lv-dot" aria-hidden="true" />
            <span className="mono">{account.displayName}</span>
          </button>
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
      <h2>{isConnected ? `Switch to ${chain.name}` : title}</h2>
      <p>{isConnected ? `Mitra’s vault on test networks lives on ${chain.name}. Your wallet is on another network.` : body}</p>
      <div className="ap-actions">
        {isConnected ? (
          <button type="button" className="btn btn-dark ap-btn" disabled={isPending} onClick={() => switchChain({ chainId: chain.id })}>
            {isPending ? "Switching…" : `Switch to ${chain.name}`} <span aria-hidden="true">→</span>
          </button>
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
      <a href={explorerTx(state.hash)} target="_blank" rel="noreferrer" className="mono">
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
    <p className={`lv-tx ${state.status}`} role="status">
      {text} {link}
    </p>
  );
}
