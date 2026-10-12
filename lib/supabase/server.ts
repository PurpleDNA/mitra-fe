import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { supabaseEnv } from "./env";

/** A per-request server client (Server Components, Route Handlers, Server Actions). */
export async function supabaseServer() {
  const cookieStore = await cookies();
  const { url, key } = supabaseEnv();
  return createServerClient(url, key, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Called from a Server Component: the proxy refreshes sessions, so this is safe to skip.
        }
      },
    },
  });
}

/** Who is signed in, as the screens name them: an email, or a wallet address for wallet sign-ins. */
export async function currentAccount(): Promise<{ id: string; label: string } | null> {
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getClaims();
  const c = data?.claims;
  if (!c?.sub) return null;
  const meta = (c.user_metadata ?? {}) as Record<string, unknown>;
  const label =
    (typeof c.email === "string" && c.email) ||
    (typeof meta.email === "string" && meta.email) ||
    walletFromSub(String(meta.sub ?? meta.custom_claims ?? "")) ||
    "Signed in";
  return { id: c.sub, label };
}

function walletFromSub(s: string): string | null {
  const m = s.match(/0x[0-9a-fA-F]{40}/);
  return m ? `${m[0].slice(0, 6)}…${m[0].slice(-4)}` : null;
}
