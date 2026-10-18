import { keccak256, toBytes } from "viem";

/**
 * The engine's signed-request format, reproduced exactly so a wallet in this app can sign
 * what the engine verifies. Sources in ../mitra: lib/domain/canonical.ts (canonicalize),
 * lib/identity/signed-request.ts (requestBodyHash, registrationRequest,
 * mitraRequestTypedData) and lib/kernel/card-sync.ts (syncRequest). A difference of one
 * byte means every signature is refused, so a cross-check against the engine's own
 * functions guards this file (see AGENTS.md).
 */

/** Canonical form: sorted object keys, ordered arrays, integers as integers. */
export function canonicalize(value: unknown): string {
  if (value === null || value === undefined) return "null";
  switch (typeof value) {
    case "boolean":
      return value ? "true" : "false";
    case "number":
      if (!Number.isFinite(value)) throw new TypeError(`cannot canonicalize non-finite number: ${value}`);
      return Number.isInteger(value) ? value.toFixed(0) : value.toFixed(6).replace(/0+$/, "").replace(/\.$/, "");
    case "string":
      return JSON.stringify(value);
    case "bigint":
      return value.toString();
  }
  if (value instanceof Date) return JSON.stringify(value.toISOString());
  if (Array.isArray(value)) return `[${value.map((v) => canonicalize(v)).join(",")}]`;
  if (typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
    return `{${entries.map(([k, v]) => `${JSON.stringify(k)}:${canonicalize(v)}`).join(",")}}`;
  }
  throw new TypeError(`cannot canonicalize ${typeof value}`);
}

export interface MitraRequest {
  op: string;
  agreementId: string;
  fromStatus: string;
  actor: string;
  bodyHash: `0x${string}`;
  expiresAt: number;
}

export function requestBodyHash(body: Record<string, unknown>): `0x${string}` {
  const { auth: _auth, ...signed } = body;
  return keccak256(toBytes(canonicalize({ domain: "mitra.request.body", value: signed })));
}

export const MITRA_REQUEST_TYPES = {
  MitraRequest: [
    { name: "op", type: "string" },
    { name: "agreementId", type: "string" },
    { name: "fromStatus", type: "string" },
    { name: "actor", type: "string" },
    { name: "bodyHash", type: "bytes32" },
    { name: "expiresAt", type: "uint256" },
  ],
} as const;

export function mitraRequestTypedData(request: MitraRequest, chainId: number) {
  return {
    domain: { name: "Mitra API", version: "1", chainId },
    types: MITRA_REQUEST_TYPES,
    primaryType: "MitraRequest" as const,
    message: { ...request, expiresAt: BigInt(request.expiresAt) },
  };
}

/** An agent's registration, signed by each of its wallets. */
export interface AgentDraft {
  agentId: string;
  name: string;
  owner: string;
  wallets: { chain: "base" | "tempo"; address: string }[];
  capabilities: string[];
  protocols: string[];
}

export function registrationRequest(agent: AgentDraft, expiresAt: number): MitraRequest {
  return {
    op: "registerAgent",
    agreementId: "",
    fromStatus: "UNREGISTERED",
    actor: agent.agentId,
    bodyHash: requestBodyHash(agent as unknown as Record<string, unknown>),
    expiresAt,
  };
}

/** A spend card, as the owner signs it for the engine (POST /api/v1/vaults/sync). */
export interface CardSync {
  chain: "base" | "tempo";
  principal: `0x${string}`;
  holder: `0x${string}`;
  agentId: string;
  capabilities: string[];
  counterparties: string[];
  issuedAt: number;
}

export const SYNC_TTL_SECONDS = 600;

export function syncRequest(card: CardSync): MitraRequest {
  return {
    op: "syncCard",
    agreementId: "",
    fromStatus: "",
    actor: card.principal.toLowerCase(),
    bodyHash: requestBodyHash(card as unknown as Record<string, unknown>),
    expiresAt: card.issuedAt + SYNC_TTL_SECONDS,
  };
}

/**
 * The engine id for an agent: its name, plus the end of its wallet address, so two
 * customers' "Research agent"s cannot collide on a shared engine.
 */
export function engineAgentId(name: string, address: string): string {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/(^|_)agent(_|$)/g, "$1")
    .replace(/^_+|_+$/g, "")
    .slice(0, 32);
  return `agent_${slug || "x"}_${address.toLowerCase().slice(-6)}`;
}
