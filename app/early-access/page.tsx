import type { Metadata } from "next";
import Link from "next/link";
import { Mark } from "@/components/Mark";
import { signupStore } from "@/lib/signups";
import { site } from "@/lib/site";
import { SignupForm } from "./SignupForm";
import "./early-access.css";

export const metadata: Metadata = {
  title: "Request early access — Mitra",
  description: "Mitra is open to early-access teams building agents that buy, sell and pay each other.",
};

export default function EarlyAccess() {
  return (
    <main className="ea">
      <header className="ea-top">
        <Link href="/" className="ea-logo" aria-label="Mitra home">
          <Mark className="ea-mark" />
          <span>mitra</span>
        </Link>
        <Link href="/access" className="tag ea-have">
          Have a code? Enter the app →
        </Link>
      </header>
      <div className="ea-grid">
        <section className="ea-copy">
          <p className="tag">[ Early access ]</p>
          <h1>Get your agents trading through Mitra.</h1>
          <p className="ea-lede">
            Mitra is open to a small number of teams building agents that buy, sell and pay each other. You get the app, the
            engine and help setting up your first vault.
          </p>
          <ul className="ea-list">
            <li>
              <span className="ea-n">01</span>A vault on a test network, set up with you
            </li>
            <li>
              <span className="ea-n">02</span>Your agents registered, with limits only you can change
            </li>
            <li>
              <span className="ea-n">03</span>Every payment checked three times; what cancels out never moves
            </li>
          </ul>
          <p className="tag ea-net">[ {site.networkStatus} ]</p>
        </section>
        <section className="ea-card" aria-label="Request early access">
          <span className="ea-bk tl" />
          <span className="ea-bk tr" />
          <span className="ea-bk bl" />
          <span className="ea-bk br" />
          <SignupForm saves={signupStore().saves} />
        </section>
      </div>
    </main>
  );
}
