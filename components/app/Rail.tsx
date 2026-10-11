"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Mark } from "@/components/Mark";

const SECTIONS = [
  { href: "", label: "Activity" },
  { href: "/agents", label: "Agents" },
  { href: "/deals", label: "Deals" },
  { href: "/clearing", label: "Clearing" },
  { href: "/recovery", label: "Recovery" },
  { href: "/vault", label: "Vault" },
  { href: "/developers", label: "Developers" },
];

/** The app's sidebar: workspace switcher and sections. On phones it folds into one bar. */
export function Rail({
  ws,
  workspaces,
  needsYou,
}: {
  ws: string;
  workspaces: { slug: string; name: string; demo: boolean }[];
  needsYou: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const base = `/app/${ws}`;
  const isOn = (href: string) => (href === "" ? pathname === base : pathname.startsWith(base + href));

  return (
    <aside className="ap-rail" aria-label="App">
      <Link href={base} className="ap-logo" aria-label="Mitra, back to Activity">
        <Mark className="ap-mark" />
        <span>mitra</span>
      </Link>
      <label className="ap-org">
        <span className="tag">Workspace</span>
        <select value={ws} onChange={(e) => router.push(`/app/${e.target.value}`)}>
          {workspaces.map((w) => (
            <option key={w.slug} value={w.slug}>
              {w.name}
              {w.demo ? " (demo)" : ""}
            </option>
          ))}
        </select>
      </label>
      <nav className="ap-nav">
        {SECTIONS.map((s) => (
          <Link key={s.label} href={base + s.href} className={isOn(s.href) ? "on" : undefined} aria-current={isOn(s.href) ? "page" : undefined}>
            <span className="ap-sq" aria-hidden="true" />
            {s.label}
            {s.href === "" && needsYou > 0 ? <span className="ap-ct">{needsYou}</span> : null}
          </Link>
        ))}
      </nav>
      <div className="ap-foot">
        <span className="ap-chip">
          <span className="ap-dot-stop" aria-hidden="true" />
          Test network
        </span>
        <Link href="/docs" className="ap-footlink">
          Docs
        </Link>
      </div>
    </aside>
  );
}
