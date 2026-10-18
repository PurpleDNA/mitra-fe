"use client";

/** Calls to the engine through the app's own forwarder (app/api/engine). */
export interface EngineReply<T = unknown> {
  ok: boolean;
  status: number;
  data?: T;
  error?: string;
  detail?: string;
}

async function call<T>(path: string, init?: RequestInit): Promise<EngineReply<T>> {
  try {
    const res = await fetch(`/api/engine/${path}`, { ...init, headers: { "content-type": "application/json" }, cache: "no-store" });
    const body = (await res.json().catch(() => ({}))) as { data?: T; error?: string; detail?: string; reasonCodes?: string[] };
    return { ok: res.ok, status: res.status, data: body.data, error: body.error, detail: body.detail ?? body.reasonCodes?.join(", ") };
  } catch (e) {
    return { ok: false, status: 0, error: "APP_UNREACHABLE", detail: e instanceof Error ? e.message : String(e) };
  }
}

export const engineGet = <T>(path: string) => call<T>(path);
export const enginePost = <T>(path: string, body: unknown) => call<T>(path, { method: "POST", body: JSON.stringify(body) });

/** What an engine refusal means, in words. The code stays in the audit details. */
export const ENGINE_PLAIN: Record<string, string> = {
  ENGINE_KEY_NOT_CONFIGURED: "The Mitra engine has no signing key yet, so it can’t approve payments. The operator needs to add it.",
  ENGINE_URL_NOT_SET: "This app isn’t connected to a Mitra engine yet.",
  ENGINE_UNREACHABLE: "The Mitra engine didn’t answer. Try again in a minute.",
  AGENT_NOT_REGISTERED: "The engine doesn’t know this agent yet. The agent registers itself first, signed by its own wallet.",
  AGENT_WALLET_IS_NOT_THE_CARD_HOLDER: "The agent registered with the engine under a different wallet than this card’s.",
  CARD_NOT_ON_CHAIN: "There are no limits on chain for this agent yet. Open its limits first.",
  CARD_REVOKED: "This card was revoked.",
  CARD_EXPIRED: "This card has ended.",
  CARD_NAMES_ANOTHER_ENGINE: "This card names a different policy engine than the one this app talks to.",
  SYNC_IS_NOT_NEWER: "A newer sync is already applied. Try again.",
  REQUEST_EXPIRED: "The signature expired before it reached the engine. Try again.",
  SIGNER_IS_NOT_THE_VAULT_OWNER: "Only the wallet that owns the vault can sync its cards.",
  SIGNED_FOR_ANOTHER_CHAIN: "Your wallet signed on another network. Switch back and try again.",
  BAD_SIGNATURE: "The engine couldn’t verify the signature.",
  RPC_NOT_CONFIGURED: "The engine isn’t set up for this network yet.",
  CHAIN_READ_FAILED: "The engine couldn’t read the chain just now. Try again.",
  AGENT_EXISTS: "An agent with this id is already registered with the engine.",
  SIGN_IN_REQUIRED: "Your session ended. Sign in again.",
  SYSTEM_PAUSED: "The engine is paused by its operator.",
  AGENT_NOT_FOUND: "The engine doesn’t know this agent.",
  WALLET_NOT_PROVEN: "The engine couldn’t verify the agent wallet’s signature.",
};
