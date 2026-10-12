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
import { BASE, TEMPO, WALLETCONNECT_PROJECT_ID } from "@/lib/chain/config";

/** WalletConnect wallets (mobile, QR) need a project id; see WALLETCONNECT_PROJECT_ID. */
const projectId = WALLETCONNECT_PROJECT_ID;

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
  chains: [BASE.chain, TEMPO.chain],
  transports: {
    // NEXT_PUBLIC_RPC_URL points Base Sepolia reads at another node, e.g. an anvil fork for testing.
    [BASE.chain.id]: http(process.env.NEXT_PUBLIC_RPC_URL || undefined),
    [TEMPO.chain.id]: http(),
  },
  ssr: true,
});

const theme = lightTheme({ accentColor: "#2b4bff", borderRadius: "none", fontStack: "system" });

export function WalletProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider theme={theme} appInfo={{ appName: "Mitra" }}>
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
