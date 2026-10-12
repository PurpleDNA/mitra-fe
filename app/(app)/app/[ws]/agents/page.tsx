import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead } from "@/components/app/Blocks";
import { AgentsLive } from "@/components/app/live/AgentsLive";
import { getWorkspace, money } from "@/lib/app/workspaces";

export const metadata = { title: "Agents" };

export default async function Agents({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const w = getWorkspace(ws);
  if (!w) notFound();

  // A real workspace: agents you register, with limits opened in the vault contract.
  if (!w.demo) {
    return (
      <>
        <PageHead title="Agents" sub="The agents that can spend from your vault, and the limits on each." />
        <AgentsLive ws={w.slug} />
      </>
    );
  }

  return (
    <>
      <PageHead title="Agents" sub="The agents that can spend from this workspace, and the limits on each." />
      <div className="ap-tbl-wrap">
        <table className="ap-tbl">
          <thead>
            <tr>
              <th>Agent</th>
              <th>Status</th>
              <th className="r">Budget</th>
              <th className="r">Used</th>
              <th className="r">Free</th>
              <th className="r">Payments</th>
              <th>Limits ends</th>
            </tr>
          </thead>
          <tbody>
            {w.agents.map((a) => (
              <tr key={a.id}>
                <td>
                  <Link href={`/app/${w.slug}/agents/${a.id}`}>
                    <b>{a.id}</b>
                  </Link>
                </td>
                <td>
                  <span className={`ap-chip ${a.status === "active" ? "paid" : "hold"}`}>{a.status}</span>
                </td>
                <td className="r">{a.limits ? money(a.limits.budget) : "No limits"}</td>
                <td className="r">{money(a.spent + a.onHold)}</td>
                <td className="r">{a.limits ? money(a.limits.budget - a.spent - a.onHold) : "—"}</td>
                <td className="r">
                  {a.payments} <span className="ap-meta">· {a.stopped} stopped</span>
                </td>
                <td>{a.limits?.ends ?? "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
