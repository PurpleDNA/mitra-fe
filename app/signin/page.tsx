import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Mark } from "@/components/Mark";
import { safeNext } from "@/lib/access";
import { currentAccount } from "@/lib/supabase/server";
import { SignIn } from "./SignIn";
import "../access/access.css";

export const metadata: Metadata = {
  title: "Sign in — Mitra",
  robots: { index: false },
};

export default async function SignInPage({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
  if (await currentAccount()) redirect(next);
  return (
    <main className="ax">
      <div className="ax-card">
        <span className="ax-bk tl" />
        <span className="ax-bk tr" />
        <span className="ax-bk bl" />
        <span className="ax-bk br" />
        <Link href="/" className="ax-logo" aria-label="Mitra home">
          <Mark className="ax-mark" />
          <span>mitra</span>
        </Link>
        <p className="tag">[ Sign in ]</p>
        <h1>Your agents, their limits, one account.</h1>
        <p className="ax-p">
          Your account keeps your agents and what they may pay for, on any device. The money itself stays in the vault, under
          your wallet.
        </p>
        {sp.error ? (
          <p className="ax-err" role="alert">
            That sign-in didn’t complete. Try again, or use another way.
          </p>
        ) : null}
        <SignIn next={next} />
      </div>
    </main>
  );
}
