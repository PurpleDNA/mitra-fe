import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHead, Pips, ResultChip, Steps } from "@/components/app/Blocks";
import { DemoAction } from "@/components/app/DemoAction";
import { getWorkspace, money, onboarding, totals } from "@/lib/app/workspaces";

export const metadata = { title: "Activity" };

export default async function Activity({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const w = getWorkspace(ws);
  if (!w) notFound();
  const state = onboarding(w);

  // A new workspace: say what Mitra is for here, and the four steps to the first payment.
  if (!state.hasActivity) {
    return (
      <>
        <div className="ap-welcome">
          <p className="tag">[ Welcome ]</p>
          <h1>Your agents haven’t asked to pay for anything yet.</h1>
          <p>
            This page fills up the moment they do: every payment an agent asks for, the three checks it went through, and
            what Mitra did with it. Four steps get you there.
          </p>
        </div>
        <Steps ws={w.slug} state={state} />
        <p className="ap-sub">
          Want to see it working first? <Link href="/app/acme">Open the demo workspace</Link>, which is filled with example
          data.
        </p>
      </>
    );
  }

  const t = totals(w);
  return (
    <>
      <PageHead title="Activity" sub="Every payment your agents asked for, and what Mitra did with it." />

      <div className="ap-stats">
        <div className="ap-stat">
          <span className="tag">Free to spend</span>
          <span className="ap-stat-v">{money(t.free)}</span>
          <span className="ap-stat-n">{w.vault.filter((v) => v.free > 0).map((v) => v.chain).join(" · ")}</span>
        </div>
        <div className="ap-stat">
          <span className="tag">On hold</span>
          <span className="ap-stat-v">{money(t.onHold)}</span>
          <span className="ap-stat-n">Waiting on checks or on you</span>
        </div>
        <div className="ap-stat tinted">
          <span className="tag">In escrow</span>
          <span className="ap-stat-v">{money(t.inEscrow)}</span>
          <span className="ap-stat-n">Until the work is accepted</span>
        </div>
        <div className="ap-stat">
          <span className="tag">Next clearing</span>
          <span className="ap-stat-v">{w.clearing?.next.at ?? "—"}</span>
          {w.clearing ? (
            <Link href={`/app/${w.slug}/clearing`} className="ap-stat-n" style={{ color: "var(--ink)" }}>
              {w.clearing.next.obligations} obligations queued →
            </Link>
          ) : null}
        </div>
      </div>

      {w.needsYou.length > 0 ? (
        <section className="ap-sec" aria-labelledby="needs">
          <h2 id="needs" className="ap-h2">
            Needs you · {w.needsYou.length}
          </h2>
          <div className="ap-inbox">
            {w.needsYou.map((n) => (
              <div key={n.paymentId} className="ap-inbox-row">
                <span className={`ap-chip ${n.kind === "stopped" ? "stop" : "hold"}`}>{n.kind === "stopped" ? "Stopped" : "Review"}</span>
                <p>
                  <b>{n.agentId}</b> {n.kind === "stopped" ? "asked to pay" : "wants to pay"} <b>{money(n.amount)}</b> to {n.to}.{" "}
                  {n.text}
                </p>
                <div className="ap-actions">
                  {n.kind === "review" ? (
                    <>
                      <DemoAction demo={w.demo}>Decline</DemoAction>
                      <DemoAction dark demo={w.demo}>
                        Approve
                      </DemoAction>
                    </>
                  ) : (
                    <>
                      <DemoAction demo={w.demo}>Pause agent</DemoAction>
                      <Link href={`/app/${w.slug}/payments/${n.paymentId}`} className="btn btn-dark ap-btn">
                        Why? →
                      </Link>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="ap-sec" aria-labelledby="feed">
        <div className="ap-sec-h">
          <h2 id="feed" className="ap-h2">
            Payments · today
          </h2>
          <div className="ap-legend tag">
            <span>
              <span className="ap-pip passed" />
              Passed
            </span>
            <span>
              <span className="ap-pip failed" />
              Failed
            </span>
            <span>
              <span className="ap-pip not-reached" />
              Not reached
            </span>
            <span>Budget · Rules · Exact match</span>
          </div>
        </div>
        <div className="ap-tbl-wrap">
          <table className="ap-tbl">
            <thead>
              <tr>
                <th>Time</th>
                <th>Agent</th>
                <th>Payment</th>
                <th>Checks</th>
                <th>Result</th>
                <th>Chain</th>
              </tr>
            </thead>
            <tbody>
              {w.payments.map((p) => (
                <tr key={p.id} className={p.result === "stopped" ? "stopped" : undefined}>
                  <td className="mono">{p.time}</td>
                  <td>
                    <Link href={`/app/${w.slug}/agents/${p.agentId}`}>{p.agentId}</Link>
                  </td>
                  <td>
                    <b>{money(p.amount)}</b> → {p.to}
                  </td>
                  <td>
                    <Pips checks={p.checks} />
                  </td>
                  <td>
                    {p.detail ? (
                      <Link href={`/app/${w.slug}/payments/${p.id}`} className="ap-chip stop">
                        Stopped · why?
                      </Link>
                    ) : (
                      <span title={p.note}>
                        <ResultChip result={p.result} />
                      </span>
                    )}
                  </td>
                  <td className="ap-meta">{p.chain}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
