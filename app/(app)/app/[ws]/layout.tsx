import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../app.css";
import { Rail } from "@/components/app/Rail";
import { DemoAction } from "@/components/app/DemoAction";
import { WalletProviders } from "@/components/app/WalletProviders";
import { WalletButton } from "@/components/app/live/Wallet";
import { PauseAll } from "@/components/app/live/StepsLive";
import { getWorkspace, listWorkspaces, workspaceSlugs } from "@/lib/app/workspaces";
import { currentAccount } from "@/lib/supabase/server";

export const dynamicParams = false;
export const generateStaticParams = () => workspaceSlugs().map((ws) => ({ ws }));

export const metadata: Metadata = {
  title: { default: "Mitra", template: "%s — Mitra" },
  robots: { index: false },
};

export default async function AppLayout({ children, params }: { children: React.ReactNode; params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const w = getWorkspace(ws);
  if (!w) notFound();
  const account = await currentAccount();
  return (
    <WalletProviders>
    <div className="ap">
      <Rail ws={w.slug} workspaces={listWorkspaces()} needsYou={w.needsYou.length} account={account?.label ?? null} />
      <div className="ap-main">
        <header className="ap-top">
          <p className="ap-top-l tag">
            {w.demo ? (
              <>
                <span className="ap-demo">Demo data</span> Example workspace. Nothing here moves money.
              </>
            ) : (
              <>{w.name} · Base Sepolia, a test network. Every action here is a real transaction from your wallet.</>
            )}
          </p>
          <div className="ap-actions">
            {w.demo ? (
              <DemoAction stop demo>
                Pause all
              </DemoAction>
            ) : (
              <PauseAll />
            )}
            <WalletButton />
          </div>
        </header>
        <main className="ap-body">{children}</main>
      </div>
    </div>
    </WalletProviders>
  );
}
