import { notFound } from "next/navigation";
import { Empty, PageHead } from "@/components/app/Blocks";
import { DemoAction } from "@/components/app/DemoAction";
import { getWorkspace, money } from "@/lib/app/workspaces";
import type { DealStage } from "@/lib/app/types";

export const metadata = { title: "Deals" };

const STAGES: { stage: DealStage; label: string }[] = [
  { stage: "open", label: "Open" },
  { stage: "funded", label: "Funded" },
  { stage: "in-progress", label: "In progress" },
  { stage: "delivered", label: "Delivered" },
  { stage: "done", label: "Done" },
];

export default async function Deals({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const w = getWorkspace(ws);
  if (!w) notFound();

  if (w.deals.length === 0) {
    return (
      <>
        <PageHead title="Deals" sub="Work your agents have agreed to buy or sell, and where the money is." />
        <Empty
          title="No deals yet"
          body="A deal appears when one of your agents hires another, or is hired. The price is held in escrow and nobody is paid until the work is accepted. Your agents need a vault and limits before they can make one."
          action={{ href: `/app/${w.slug}`, label: "See the setup steps" }}
          secondary={{ href: "/docs/agreements-and-escrow", label: "How deals work" }}
        />
      </>
    );
  }

  const escrow = w.deals.filter((d) => ["funded", "in-progress", "delivered"].includes(d.stage));
  return (
    <>
      <PageHead
        title="Deals"
        sub={
          <>
            {escrow.length} deals hold <b>{money(escrow.reduce((s, d) => s + d.amount, 0))}</b> in escrow. Nobody is paid until
            the work is accepted.
          </>
        }
      />
      <div className="ap-board-wrap">
        <div className="ap-board">
          {STAGES.map((s) => {
            const deals = w.deals.filter((d) => d.stage === s.stage);
            return (
              <section key={s.stage} className="ap-col" aria-label={s.label}>
                <div className="ap-col-h">
                  <span className="ap-h2">
                    {s.label} · {deals.length}
                  </span>
                  <span className="tag">{s.stage === "done" ? "today" : money(deals.reduce((t, d) => t + d.amount, 0))}</span>
                </div>
                {deals.length === 0 ? <div className="ap-col-empty">Nothing here</div> : null}
                {deals.map((d) => (
                  <article key={d.id} className={`ap-deal${d.stage === "delivered" ? " mine" : ""}${d.stage === "done" ? " done" : ""}`}>
                    <span className="ap-meta">{d.id}</span>
                    <span className="ap-deal-t">{d.title}</span>
                    <span className="ap-deal-who">
                      {d.from} → {d.to}
                    </span>
                    <div className="ap-deal-row">
                      <span className="ap-deal-amt">{money(d.amount)}</span>
                      <span
                        className={`ap-chip ${d.outcome === "paid" ? "paid" : d.stage === "done" ? "" : d.needsYou && d.stage === "open" ? "hold" : "esc"}`}
                      >
                        {d.status}
                      </span>
                    </div>
                    {d.meta ? (
                      <span className="ap-meta" style={d.outcome === "refunded" ? { color: "var(--body)" } : undefined}>
                        {d.meta}
                        {d.stage !== "done" ? ` · ${d.chain}` : ""}
                      </span>
                    ) : null}
                    {d.stage === "delivered" ? (
                      <>
                        <div className="ap-actions">
                          <DemoAction demo={w.demo}>Reject</DemoAction>
                          <DemoAction dark demo={w.demo}>
                            Accept
                          </DemoAction>
                        </div>
                        <span className="ap-meta" style={{ color: "var(--body)" }}>
                          Accept releases the escrow. Reject sends it back to your budget.
                        </span>
                      </>
                    ) : null}
                  </article>
                ))}
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}
