import type { Metadata } from "next";
import { notFound } from "next/navigation";
import "../../app.css";
import { Rail } from "@/components/app/Rail";
import { DemoAction } from "@/components/app/DemoAction";
import { getWorkspace, listWorkspaces, workspaceSlugs } from "@/lib/app/workspaces";

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
  return (
    <div className="ap">
      <Rail ws={w.slug} workspaces={listWorkspaces()} needsYou={w.needsYou.length} />
      <div className="ap-main">
        <header className="ap-top">
          <p className="ap-top-l tag">
            {w.demo ? (
              <>
                <span className="ap-demo">Demo data</span> Example workspace. Nothing here moves money.
              </>
            ) : (
              <>{w.name}</>
            )}
          </p>
          <DemoAction stop demo={w.demo}>
            Pause all
          </DemoAction>
        </header>
        <main className="ap-body">{children}</main>
      </div>
    </div>
  );
}
