import { notFound } from "next/navigation";
import { Empty, PageHead } from "@/components/app/Blocks";
import { getWorkspace, money } from "@/lib/app/workspaces";

export const metadata = { title: "Recovery" };

export default async function Recovery({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const w = getWorkspace(ws);
  if (!w) notFound();
  const sub = "When a deal fails, the money comes back on its own. This is where you see it happen.";

  if (w.recoveries.length === 0) {
    return (
      <>
        <PageHead title="Recovery" sub={sub} />
        <Empty
          title="Nothing to recover"
          body={
            w.deals.length === 0
              ? "Recovery starts when a deal fails: the work is rejected, or nothing is delivered by the deadline. Once your agents make deals, any refund shows up here."
              : "No deal has failed. If one does, its escrow goes back to your budget and you will see where every dollar is."
          }
          secondary={{ href: "/docs/sagas-and-recovery", label: "How recovery works" }}
        />
      </>
    );
  }

  return (
    <>
      <PageHead title="Recovery" sub={sub} />
      <div className="ap-tbl-wrap">
        <table className="ap-tbl">
          <thead>
            <tr>
              <th>When</th>
              <th>Deal</th>
              <th>Why</th>
              <th className="r">Amount</th>
              <th>Where it is</th>
            </tr>
          </thead>
          <tbody>
            {w.recoveries.map((r) => (
              <tr key={r.id}>
                <td className="mono">{r.when}</td>
                <td>{r.deal}</td>
                <td>{r.reason}</td>
                <td className="r">{money(r.amount)}</td>
                <td>
                  <span className={`ap-chip ${r.state === "returned" ? "paid" : "hold"}`}>
                    {r.state === "returned" ? "Back in your budget" : "On its way back"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
