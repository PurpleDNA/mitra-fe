/**
 * The early-access gate in front of /app.
 *
 * Codes come from MITRA_EARLY_ACCESS_CODES (comma- or space-separated, one per person or
 * team) and the older single MITRA_EARLY_ACCESS_CODE; both are honoured. Entering a code
 * stores a cookie holding a keyed hash of THAT code, never the code itself, so removing one
 * code from the list locks out only the people who used it. With no code configured the
 * gate admits nobody: it fails closed.
 *
 * This is an early-access gate, not authentication; sign-in (Supabase) is the second door.
 *
 * Web Crypto only, so the same code runs in the proxy and in the server action.
 */
export const ACCESS_COOKIE = "mitra_access";
export const ACCESS_MAX_AGE = 60 * 60 * 24 * 30;

const enc = new TextEncoder();

async function hmacHex(key: string, message: string): Promise<string> {
  const k = await crypto.subtle.importKey("raw", enc.encode(key), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", k, enc.encode(message));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function sameLength(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function configuredCodes(): string[] {
  const list = (process.env.MITRA_EARLY_ACCESS_CODES ?? "").split(/[\s,]+/);
  const single = process.env.MITRA_EARLY_ACCESS_CODE ?? "";
  return [...new Set([...list, single].map((c) => c.trim()).filter(Boolean))];
}

/** The cookie value a given code earns. The derivation is unchanged, so existing cookies stay valid. */
export async function accessToken(code: string): Promise<string> {
  return hmacHex(code, "mitra-early-access-v1");
}

/**
 * The configured code the input matches, or null. Codes are matched exactly, or in
 * upper case, so "mitra-7kq4-…" typed in lower case still works. Hashes are compared,
 * so the comparison leaks neither length nor prefix.
 */
export async function matchCode(input: string): Promise<string | null> {
  const typed = input.trim();
  if (!typed) return null;
  const candidates = [...new Set([typed, typed.toUpperCase()])];
  for (const code of configuredCodes()) {
    const want = await hmacHex("cmp", code);
    for (const c of candidates) if (sameLength(await hmacHex("cmp", c), want)) return code;
  }
  return null;
}

export async function cookieGrantsAccess(value: string | undefined): Promise<boolean> {
  if (!value) return false;
  for (const code of configuredCodes()) if (sameLength(value, await accessToken(code))) return true;
  return false;
}

/** Only ever send people back into the app, never to another site. */
export function safeNext(next: string | null | undefined): string {
  return next && /^\/app(\/[A-Za-z0-9_\-/]*)?$/.test(next) ? next : "/app";
}
