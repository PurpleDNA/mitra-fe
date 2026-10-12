import { parseAbi } from "viem";
import { baseSepolia } from "viem/chains";

/**
 * The on-chain side of the app: the canonical MitraVault the engine settles through,
 * and the token it holds. Quoted from ../mitra/lib/evm/deployments.json (revision F61,
 * runtimeCodeMatchesArtifact) and read back from Base Sepolia before use: the address
 * carries code and PERMIT_TYPEHASH() answers. Never retype an address from a summary
 * (engine F58); copy it from that file.
 *
 * Base Sepolia only for now. Tempo Moderato has the same contract, but wallets do not
 * handle its stablecoin-paid gas well yet; add it here when one is tested end to end.
 */
export const chain = baseSepolia;

export const VAULT = "0x92dcee6acbfcf50f32a3e9c689d7f2ceef9ee489" as const;

/** Circle's test USDC on Base Sepolia, the token the engine's live runs settled in. */
export const USDC = { address: "0x036CbD53842c5426634e7929541eC2318f3dCF7e", symbol: "USDC", decimals: 6 } as const;

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

export const FAUCET_URL = "https://faucet.circle.com";
export const explorerTx = (hash: string) => `https://sepolia.basescan.org/tx/${hash}`;
export const explorerAddress = (a: string) => `https://sepolia.basescan.org/address/${a}`;

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
