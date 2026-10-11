import Link from "next/link";
import { notFound } from "next/navigation";
import { Empty, PageHead, ResultChip } from "@/components/app/Blocks";
import { DemoAction } from "@/components/app/DemoAction";
import { getWorkspace, money, workspaceSlugs } from "@/lib/app/workspaces";

export const dynamicParams = false;
export function generateStaticParams() {
  return workspaceSlugs().flatMap((ws) => (getWorkspace(ws)?.agents ?? []).map((a) => ({ ws, id: a.id })));
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: (await params).id };
}

export default async function AgentPage({ params }: { params: Promise<{ ws: string; id: string }> }) {
  const { ws, id } = await params;
  const w = getWorkspace(ws);
  const a = w?.agents.find((x) => x.id === id);
  if (!w || !a) notFound();
  const l = a.limits;
  const recent = w.payments.filter((p) => p.agentId === a.id).slice(0, 5);
  const free = l ? l.budget - a.spent - a.onHold : 0;

  return (
    <>
      <p className="tag" style={{ margin: 0 }}>
        <Link href={`/app/${w.slug}/agents`} style={{ color: "var(--mute)", textDecoration: "none" }}>
          Agents
        </Link>{" "}
        / <span style={{ color: "var(--ink)" }}>{a.id}</span>
      </p>
      <PageHead
        title={a.id}
        sub={
          <span className="ap-meta">
            Pays from wallet {a.wallet} · registered {a.registered} · {a.payments} payments, {a.stopped} stopped
          </span>
        }
        actions={
          <>
            <DemoAction stop demo={w.demo}>
              Pause agent
            </DemoAction>
            <DemoAction demo={w.demo}>Revoke limits</DemoAction>
            <DemoAction dark demo={w.demo}>
              Edit limits
            </DemoAction>
          </>
        }
      />

      {!l ? (
        <Empty
          title="This agent has no limits yet"
          body="Until it has limits, every payment it asks for is refused. Give it a budget, a cap per payment and who it may pay."
          action={{ href: `/app/${w.slug}/developers#limits`, label: "Set its limits" }}
        />
      ) : (
        <div className="ap-grid2">
          <section className="ap-card" aria-labelledby="lim">
            <span className="ap-bk tl" />
            <span className="ap-bk tr" />
            <span className="ap-bk bl" />
            <span className="ap-bk br" />
            <div className="ap-sec-h" style={{ marginBottom: 8 }}>
              <h2 id="lim" style={{ margin: 0, fontSize: 22, fontWeight: 600, letterSpacing: "-0.02em" }}>
                Limits
              </h2>
              <span className="tag">
                Mandate {l.mandateId} · version {l.version}
              </span>
            </div>
            <dl className="ap-dl">
              <dt>Budget</dt>
              <dd>
                <b>{money(l.budget)}</b> in total
              </dd>
              <dt>Per payment</dt>
              <dd>
                Up to <b>{money(l.perPayment)}</b>
              </dd>
              {l.perDay ? (
                <>
                  <dt>In any 24 hours</dt>
                  <dd>
                    Up to <b>{money(l.perDay)}</b>
                  </dd>
                </>
              ) : null}
              {l.reviewAbove ? (
                <>
                  <dt>Needs you</dt>
                  <dd>
                    Any payment over <b>{money(l.reviewAbove)}</b>
                  </dd>
                </>
              ) : null}
              <dt>Pays</dt>
              <dd>{l.payees.join(", ")}</dd>
              <dt>For</dt>
              <dd className="mono" style={{ fontSize: 13 }}>
                {l.purposes.join(", ")}
              </dd>
              <dt>On</dt>
              <dd>{l.chains.join(", ")}</dd>
              <dt>Ends</dt>
              <dd>{l.ends}</dd>
            </dl>
            <p style={{ margin: "16px 0 0", fontSize: 13, lineHeight: 1.5, color: "var(--mute)" }}>
              Set by {l.setBy}. Only {w.name} can change these, and every change needs your signature. The agent can read its
              limits; it can never edit them.
            </p>
          </section>

          <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            <section className="ap-panel" aria-labelledby="plain">
              <h2 id="plain" className="ap-h2" style={{ color: "var(--mute)", marginBottom: 10 }}>
                In plain words
              </h2>
              <p style={{ margin: 0, fontSize: 19, lineHeight: 1.5, letterSpacing: "-0.01em" }}>
                {a.id} can spend <b>{money(free)} more</b> before {l.ends}, at most {money(l.perPayment)} at a time, only with{" "}
                {l.payees.join(" or ")}, on {l.chains.join(" or ")}.
                {l.reviewAbove ? ` Anything over ${money(l.reviewAbove)} waits for you.` : ""}
              </p>
            </section>

            <section className="ap-sec" aria-labelledby="room">
              <div className="ap-sec-h">
                <h2 id="room" className="ap-h2">
                  Budget used
                </h2>
                <span className="tag">
                  {money(a.spent + a.onHold)} of {money(l.budget)}
                </span>
              </div>
              <div
                className="ap-bar"
                role="img"
                aria-label={`Spent ${money(a.spent)}, on hold ${money(a.onHold)}, free ${money(free)} of ${money(l.budget)}`}
              >
                <span style={{ width: `${(a.spent / l.budget) * 100}%`, background: "var(--ink)" }} />
                <span className="ap-hatch" style={{ width: `${(a.onHold / l.budget) * 100}%` }} />
                <span style={{ flex: 1, background: "var(--accent-tint)" }} />
              </div>
              <div className="ap-legend tag">
                <span>Spent {money(a.spent)}</span>
                <span>On hold {money(a.onHold)}</span>
                <span>Free {money(free)}</span>
              </div>
            </section>

            <section className="ap-sec" aria-labelledby="recent">
              <div className="ap-sec-h">
                <h2 id="recent" className="ap-h2">
                  Recent payments
                </h2>
                <Link href={`/app/${w.slug}`} className="tag" style={{ color: "var(--ink)" }}>
                  All activity →
                </Link>
              </div>
              {recent.length === 0 ? (
                <p className="ap-sub">No payments yet.</p>
              ) : (
                <div className="ap-tbl-wrap">
                  <table className="ap-tbl">
                    <tbody>
                      {recent.map((p) => (
                        <tr key={p.id}>
                          <td className="mono">{p.time}</td>
                          <td>
                            <b>{money(p.amount)}</b> → {p.to}
                          </td>
                          <td className="r">
                            {p.detail ? (
                              <Link href={`/app/${w.slug}/payments/${p.id}`} className="ap-chip stop">
                                Stopped · why?
                              </Link>
                            ) : (
                              <ResultChip result={p.result} />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        </div>
      )}
    </>
  );
}
