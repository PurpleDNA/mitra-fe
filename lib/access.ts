/**
 * The early-access gate in front of /app.
 *
 * One shared code, set in MITRA_EARLY_ACCESS_CODE. Entering it stores a cookie holding a
 * keyed hash of the code, never the code itself; changing the code locks everyone out
 * again. With the variable unset the gate admits nobody: it fails closed.
 *
 * This is an early-access gate, not authentication. The engine has no customer accounts
 * yet; when it does, real sign-in replaces this.
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

const configuredCode = () => process.env.MITRA_EARLY_ACCESS_CODE?.trim() || null;

/** The cookie value a correct code earns. Null when no code is configured. */
export async function accessToken(): Promise<string | null> {
  const code = configuredCode();
  return code ? hmacHex(code, "mitra-early-access-v1") : null;
}

export async function codeIsCorrect(input: string): Promise<boolean> {
  const code = configuredCode();
  if (!code) return false;
  // Compare hashes, so the comparison does not leak the code's length or prefix.
  const [a, b] = await Promise.all([hmacHex("cmp", input.trim()), hmacHex("cmp", code)]);
  return sameLength(a, b);
}

export async function cookieGrantsAccess(value: string | undefined): Promise<boolean> {
  const token = await accessToken();
  return Boolean(token && value && sameLength(value, token));
}

/** Only ever send people back into the app, never to another site. */
export function safeNext(next: string | null | undefined): string {
  return next && /^\/app(\/[A-Za-z0-9_\-/]*)?$/.test(next) ? next : "/app";
}
