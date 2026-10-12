"use client";

import "@rainbow-me/rainbowkit/styles.css";
import { connectorsForWallets, lightTheme, RainbowKitProvider } from "@rainbow-me/rainbowkit";
import {
  coinbaseWallet,
  injectedWallet,
  metaMaskWallet,
  rabbyWallet,
  rainbowWallet,
  walletConnectWallet,
} from "@rainbow-me/rainbowkit/wallets";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { createConfig, http, WagmiProvider } from "wagmi";
import { chain } from "@/lib/chain/config";

/**
 * WalletConnect wallets (mobile, QR) need a project id from cloud.reown.com, set in
 * NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID. Without one, only browser-extension wallets are
 * offered, which is enough to test with MetaMask, Rabby or Coinbase Wallet.
 */
const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";

const connectors = connectorsForWallets(
  [
    {
      groupName: "Wallets",
      wallets: projectId
        ? [metaMaskWallet, rabbyWallet, coinbaseWallet, rainbowWallet, walletConnectWallet]
        : [injectedWallet, coinbaseWallet],
    },
  ],
  { appName: "Mitra", projectId: projectId || "unset" },
);

const config = createConfig({
  connectors,
  chains: [chain],
  // NEXT_PUBLIC_RPC_URL points reads at another node, e.g. a local anvil fork for testing.
  transports: { [chain.id]: http(process.env.NEXT_PUBLIC_RPC_URL || undefined) },
  ssr: true,
});

const theme = lightTheme({ accentColor: "#2b4bff", borderRadius: "none", fontStack: "system" });

export function WalletProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme} initialChain={chain} appInfo={{ appName: "Mitra" }}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
