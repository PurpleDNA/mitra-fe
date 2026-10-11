import Link from "next/link";
import { notFound } from "next/navigation";
import { Empty, PageHead } from "@/components/app/Blocks";
import { getWorkspace, money } from "@/lib/app/workspaces";

export const metadata = { title: "Agents" };

export default async function Agents({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const w = getWorkspace(ws);
  if (!w) notFound();

  if (w.agents.length === 0) {
    return (
      <>
        <PageHead title="Agents" sub="The agents that can spend from this workspace, and the limits on each." />
        <Empty
          title="No agents yet"
          body="Register an agent so Mitra knows who it is and which wallet it signs with. Then give it limits: a budget, a cap per payment and who it may pay."
          action={{ href: `/app/${w.slug}/developers#register`, label: "Register an agent" }}
          secondary={{ href: "/docs/engravings-and-mandates", label: "How limits work" }}
        />
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
