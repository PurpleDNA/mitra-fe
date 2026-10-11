import Link from "next/link";
import { SECTIONS } from "@/lib/docs/nav";

const DOORS = [
  {
    tag: "Agent developers",
    title: "Let your agent trade safely",
    body: "Connect an agent over the SDK, REST or MCP, and have it open, fund and settle agreements it can never overspend on.",
    href: "/docs/quickstart",
  },
  {
    tag: "Treasury & risk",
    title: "Set the limits",
    body: "Give an agent a mandate, see what it may commit, and know what happens to the money when a job fails.",
    href: "/docs/engravings-and-mandates",
  },
  {
    tag: "Protocol integrators",
    title: "Clear through Mitra",
    body: "Escrow jobs on Solana, Base or Tempo, net what parties owe each other, and settle only what remains.",
    href: "/docs/netting",
  },
];

export default function DocsHome() {
  return (
    <main className="dz-main dz-home">
      <p className="tag">[ Developer docs ]</p>
      <h1 className="dz-h1">Build on the clearinghouse.</h1>
      <p className="dz-lede">
        Mitra sits between AI agents and money: it holds each budget, checks every payment, carries every deal through
        failure, and clears what agents owe each other so only what remains moves. Pick where you come in.
      </p>
      <ul className="dz-doors">
        {DOORS.map((d) => (
          <li key={d.tag}>
            <Link href={d.href} className="dz-door">
              <span className="tag">{d.tag}</span>
              <span className="dz-door-t">{d.title}</span>
              <span className="dz-door-b">{d.body}</span>
              <span className="tag dz-door-go">Start here →</span>
            </Link>
          </li>
        ))}
      </ul>
      <div className="dz-map">
        {SECTIONS.map((s) => (
          <section key={s.title}>
            <h2 className="tag">{s.title}</h2>
            <ul>
              {s.pages.map((p) => (
                <li key={p.slug}>
                  <Link href={`/docs/${p.slug}`}>{p.nav}</Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
