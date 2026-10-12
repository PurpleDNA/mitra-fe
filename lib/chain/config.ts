import { defineChain, parseAbi, type Chain } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * The on-chain side of the app: the canonical MitraVault the engine settles through on
 * each test network, and the token it holds there. Vault addresses are quoted from
 * ../mitra/lib/evm/deployments.json (revision F61, runtimeCodeMatchesArtifact) and were
 * read back from each chain on 2026-10-12: 8,816 bytes of code and PERMIT_TYPEHASH()
 * 0xcae3f4fb… on both. Never retype an address from a summary (engine F58).
 *
 * Both tokens have 6 decimals; the amount helpers in hooks.ts rely on that.
 */
export type NetKey = "base" | "tempo";

export interface Net {
  /** The engine's name for the chain (approvedChains, agent wallets). */
  key: NetKey;
  chain: Chain;
  label: string;
  vault: `0x${string}`;
  token: { address: `0x${string}`; symbol: string; decimals: 6 };
  explorer: string;
  /** Where test money comes from. "rpc" means Moderato's tempo_fundAddress, called from the app. */
  faucet: { kind: "link"; url: string; name: string } | { kind: "rpc" };
  /** What pays for transactions, in words. */
  gasNote: string;
}

/**
 * Tempo Moderato as a wallet should add it. viem's own `tempoModerato` declares a
 * 6-decimal native currency, which MetaMask refuses (it requires 18), and Tempo has no
 * usable native coin anyway: fees are paid in a TIP-20 stablecoin (engine F12). Plain
 * EIP-1559 transactions with default fees were checked on Moderato on 2026-10-12
 * (approve, deposit, openMandate, all status success; the fee came out of PathUSD).
 */
export const tempoModerato = defineChain({
  id: 42431,
  name: "Tempo Moderato",
  nativeCurrency: { name: "USD", symbol: "USD", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.moderato.tempo.xyz"] } },
  blockExplorers: { default: { name: "Tempo Explorer", url: "https://explore.testnet.tempo.xyz" } },
  testnet: true,
});

export const BASE: Net = {
  key: "base",
  chain: baseSepolia,
  label: "Base Sepolia",
  vault: "0x92dcee6acbfcf50f32a3e9c689d7f2ceef9ee489",
  // Circle's test USDC, the token the engine's live runs settled in.
  token: { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", symbol: "USDC", decimals: 6 },
  explorer: "https://sepolia.basescan.org",
  faucet: { kind: "link", url: "https://faucet.circle.com", name: "Circle’s faucet" },
  gasNote: "You also need a little Base Sepolia ETH for gas.",
};

export const TEMPO: Net = {
  key: "tempo",
  chain: tempoModerato,
  label: "Tempo Moderato",
  vault: "0x85409dfc30fa0671b06f98cc56c5b04eb921b568",
  // PathUSD, TIP-20 index 0; the engine asserts name() == "PathUSD" before moving value.
  token: { address: "0x20c0000000000000000000000000000000000000", symbol: "PathUSD", decimals: 6 },
  explorer: "https://explore.testnet.tempo.xyz",
  faucet: { kind: "rpc" },
  gasNote: "Fees are paid in the stablecoin itself, a fraction of a cent each. Ignore the USD balance your wallet shows: Tempo has no gas coin.",
};

export const NETWORKS: Net[] = [BASE, TEMPO];
export const DEFAULT_NET = BASE;
export const netFor = (chainId: number | undefined): Net | null => NETWORKS.find((n) => n.chain.id === chainId) ?? null;

export const explorerTx = (net: Net, hash: string) => `${net.explorer}/tx/${hash}`;
export const explorerAddress = (net: Net, a: string) => `${net.explorer}/address/${a}`;

/**
 * The policy engine a mandate names: the only key whose permits the vault will honour.
 * The default is the engine's testnet key (the deployer in deployments.json, which
 * scripts/live-evm-vault.mjs uses as the engine). Override with
 * NEXT_PUBLIC_MITRA_POLICY_ENGINE when the engine runs with a different key.
 */
export const POLICY_ENGINE = (process.env.NEXT_PUBLIC_MITRA_POLICY_ENGINE ||
  "0x7823d6bEA51cC21C5d8588C7ff72E33130848116") as `0x${string}`;

/**
 * WalletConnect (Reown) project id: turns on mobile and QR wallets in the connect modal.
 * Set NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID in Vercel (Production and Preview) and in
 * .env.local; get one at https://cloud.reown.com. Empty, the modal offers browser-extension
 * wallets and Coinbase Wallet only.
 */
export const WALLETCONNECT_PROJECT_ID = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "";


/** The surface of contracts/MitraVault.sol the app calls. */
export const VAULT_ABI = parseAbi([
  "function vaults(address principal, address token) view returns (uint256 total, uint256 available, uint256 reserved, uint256 escrowed, uint256 encumbered, uint256 settling, uint256 frozen, bool emergencyFreeze)",
  "function mandates(address principal, address holder, address token) view returns (address principal, address holder, uint64 limit, uint64 ceiling, uint64 spent, uint64 expiresAt, uint32 version, address policyEngine, bool revoked)",
  "function deposit(address token, uint256 amount)",
  "function withdraw(address token, uint256 amount, address recipient)",
  "function setEmergencyFreeze(address token, bool freeze)",
  "function openMandate(address holder, address token, uint64 limit, uint64 ceiling, uint64 expiresAt, address policyEngine)",
  "function amendMandate(address holder, address token, uint64 newLimit, uint64 newCeiling, uint64 newExpiresAt)",
  "function revokeMandate(address principal, address holder, address token)",
]);

export const ERC20_ABI = parseAbi([
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) returns (bool)",
]);
