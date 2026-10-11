import type { Metadata } from "next";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { safeNext } from "@/lib/access";
import { site } from "@/lib/site";
import { unlock } from "./actions";
import "./access.css";

export const metadata: Metadata = {
  title: "Early access — Mitra",
  robots: { index: false },
};

export default async function Access({ searchParams }: { searchParams: Promise<{ next?: string; error?: string }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next);
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
        <p className="tag">[ Early access ]</p>
        <h1>The Mitra app is open to early-access teams.</h1>
        <p className="ax-p">
          It runs on test networks today. If your team has been given an access code, enter it here. If not, ask for one and
          we will get back to you.
        </p>
        <form action={unlock} className="ax-form">
          <input type="hidden" name="next" value={next} />
          <label htmlFor="code" className="tag">
            Access code
          </label>
          <div className="ax-row">
            <input
              id="code"
              name="code"
              type="password"
              autoComplete="off"
              required
              aria-invalid={sp.error ? true : undefined}
              aria-describedby={sp.error ? "code-error" : undefined}
            />
            <button type="submit" className="btn btn-dark">
              Enter <span aria-hidden="true">→</span>
            </button>
          </div>
          {sp.error ? (
            <p id="code-error" className="ax-err" role="alert">
              That code isn’t right. Check it and try again.
            </p>
          ) : null}
        </form>
        <div className="ax-alt">
          <Link href={site.earlyAccessHref} className="btn btn-line">
            Request early access
          </Link>
          <Link href="/docs" className="ax-link">
            Read the docs meanwhile →
          </Link>
        </div>
      </div>
    </main>
  );
}
