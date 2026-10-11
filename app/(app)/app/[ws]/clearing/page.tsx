import { notFound } from "next/navigation";
import { Empty, PageHead } from "@/components/app/Blocks";
import { getWorkspace, money } from "@/lib/app/workspaces";

export const metadata = { title: "Clearing" };

export default async function Clearing({ params }: { params: Promise<{ ws: string }> }) {
  const { ws } = await params;
  const w = getWorkspace(ws);
  if (!w) notFound();
  const sub = "Everything your agents owe and are owed is added up first. Only what remains moves.";

  if (!w.clearing) {
    return (
      <>
        <PageHead title="Clearing" sub={sub} />
        <Empty
          title="Nothing to clear yet"
          body="Once your agents owe and are owed money, Mitra adds it all up at each clearing window, cancels what cancels out, and moves only the remainder. You will see what was owed, what moved and what never had to."
          action={{ href: `/app/${w.slug}`, label: "See the setup steps" }}
          secondary={{ href: "/docs/netting", label: "How clearing works" }}
        />
      </>
    );
  }

  const c = w.clearing;
  return (
    <>
      <PageHead title="Clearing" sub={sub} />
      <section className="ap-clear" aria-labelledby="next">
        <div className="ap-clear-h">
          <h2 id="next">Next clearing at {c.next.at}</h2>
          <span className="ap-chip hold">Open · {c.next.obligations} obligations so far</span>
        </div>
        <div className="ap-clear-ab">
          <div>
            <span className="tag">If everyone paid in full</span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
              <span className="ap-big">{money(c.next.gross)}</span>
              <span className="tag">{c.next.grossPayments} payments</span>
            </div>
            <span className="ap-grow" style={{ width: "100%", background: "var(--ink)" }} />
          </div>
          <div>
            <span className="tag" style={{ color: "var(--ink)" }}>
              After clearing
            </span>
            <div style={{ display: "flex", alignItems: "baseline", gap: 14, flexWrap: "wrap" }}>
              <span className="ap-big" style={{ color: "var(--accent)" }}>
                {money(c.next.net)}
              </span>
              <span className="tag">{c.next.netPayments} payments</span>
            </div>
            <span className="ap-grow" style={{ width: `${(c.next.net / c.next.gross) * 100}%`, background: "var(--accent)", animationDelay: "0.5s" }} />
          </div>
        </div>
        <p className="ap-clear-f">
          <b>{money(c.next.gross - c.next.net)} won’t have to move.</b>{" "}
          <span style={{ color: "var(--mute)" }}>Projected from what is queued now; the numbers settle when the window closes.</span>
        </p>
      </section>

      <div className="ap-grid2">
        <section className="ap-sec" aria-labelledby="who">
          <h2 id="who" className="ap-h2">
            Who owes whom
          </h2>
          <div className="ap-tbl-wrap">
            <table className="ap-tbl">
              <thead>
                <tr>
                  <th>With</th>
                  <th className="r">You owe</th>
                  <th className="r">They owe you</th>
                  <th className="r">After clearing</th>
                </tr>
              </thead>
              <tbody>
                {c.counterparties.map((cp) => {
                  const net = cp.youOwe - cp.theyOwe;
                  return (
                    <tr key={cp.name}>
                      <td>{cp.name}</td>
                      <td className="r">{money(cp.youOwe)}</td>
                      <td className="r">{money(cp.theyOwe)}</td>
                      <td className="r">
                        <b>{net >= 0 ? `You pay ${money(net)}` : `They pay ${money(-net)}`}</b>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
        <section className="ap-sec" aria-labelledby="moves">
          <h2 id="moves" className="ap-h2">
            What will move
          </h2>
          <div className="ap-tbl-wrap">
            <table className="ap-tbl">
              <thead>
                <tr>
                  <th>From</th>
                  <th>To</th>
                  <th className="r">Amount</th>
                  <th>Chain</th>
                </tr>
              </thead>
              <tbody>
                {c.moves.map((m) => (
                  <tr key={`${m.from}-${m.to}`}>
                    <td>{m.from}</td>
                    <td>{m.to}</td>
                    <td className="r">{money(m.amount)}</td>
                    <td className="ap-meta">{m.chain}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "var(--mute)" }}>
            Each of these goes through the same three checks as any other payment. Money in different currencies is never
            netted against each other.
          </p>
        </section>
      </div>

      <section className="ap-sec" aria-labelledby="past">
        <h2 id="past" className="ap-h2">
          Earlier today
        </h2>
        <div className="ap-tbl-wrap">
          <table className="ap-tbl">
            <thead>
              <tr>
                <th>Window</th>
                <th className="r">Owed in full</th>
                <th className="r">Moved</th>
                <th className="r">Didn’t have to move</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {c.past.map((p) => (
                <tr key={p.window}>
                  <td className="mono">{p.window}</td>
                  <td className="r">
                    {p.grossPayments} payments · {money(p.gross)}
                  </td>
                  <td className="r">
                    {p.netPayments} {p.netPayments === 1 ? "payment" : "payments"} · {money(p.net)}
                  </td>
                  <td className="r">{money(p.gross - p.net)}</td>
                  <td>
                    <span className="ap-chip paid">Settled</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
