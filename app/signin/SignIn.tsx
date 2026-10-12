"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { supabaseBrowser } from "@/lib/supabase/client";

type Busy = null | "google" | "email" | "wallet";

/** Every way in. Each failure says what happened in words; none pretends to have worked. */
export function SignIn({ next }: { next: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  const callback = () => `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}`;

  async function oauth(provider: "google") {
    setBusy(provider);
    setError(null);
    const { error } = await supabaseBrowser().auth.signInWithOAuth({ provider, options: { redirectTo: callback() } });
    if (error) {
      setError(plain(error.message, "Google"));
      setBusy(null);
    }
  }

  async function magicLink() {
    setBusy("email");
    setError(null);
    const { error } = await supabaseBrowser().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: callback() } });
    setBusy(null);
    if (error) setError(plain(error.message, "Email"));
    else setSent(true);
  }

  async function wallet() {
    if (!("ethereum" in window)) {
      setError("No browser wallet found. Install MetaMask or Rabby, or sign in another way.");
      return;
    }
    setBusy("wallet");
    setError(null);
    const { error } = await supabaseBrowser().auth.signInWithWeb3({
      chain: "ethereum",
      statement: "Sign in to Mitra. This signs a message only: it moves no money and costs no gas.",
    });
    setBusy(null);
    if (error) setError(plain(error.message, "Wallet"));
    else router.replace(next);
  }

  return (
    <div className="si">
      <button type="button" className="btn btn-line si-btn" disabled={busy !== null} onClick={() => oauth("google")}>
        {busy === "google" ? "Opening Google…" : "Continue with Google"}
      </button>
      <button type="button" className="btn btn-dark si-btn" disabled={busy !== null} onClick={wallet}>
        {busy === "wallet" ? "Check your wallet…" : "Sign in with your wallet"}
      </button>

      <div className="si-or tag">or with email</div>
      {sent ? (
        <p className="ax-p" role="status">
          Check {email.trim()} for a sign-in link. It works once, in this browser.
        </p>
      ) : (
        <form
          className="ax-form"
          onSubmit={(e) => {
            e.preventDefault();
            void magicLink();
          }}
        >
          <div className="ax-row">
            <input type="email" required placeholder="you@company.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="Email" />
            <button type="submit" className="btn btn-dark" disabled={busy !== null}>
              {busy === "email" ? "Sending…" : "Send link"}
            </button>
          </div>
        </form>
      )}
      {error ? (
        <p className="ax-err" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function plain(message: string, how: string): string {
  if (/provider is not enabled|Unsupported provider|not enabled/i.test(message)) return `${how} sign-in isn’t switched on yet. Use another way for now.`;
  if (/rate limit/i.test(message)) return "Too many attempts. Wait a minute and try again.";
  if (/user rejected|denied/i.test(message)) return "You declined in your wallet. Nothing was signed.";
  if (/redirect|uri|domain/i.test(message)) return `${how} sign-in isn’t allowed from this address yet. Use another way for now.`;
  return `${how} sign-in failed: ${message}`;
}
