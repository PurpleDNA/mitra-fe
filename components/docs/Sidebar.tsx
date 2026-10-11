"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { SECTIONS, TRACKS, type Track } from "@/lib/docs/nav";

const KEY = "mitra-docs-track";

/**
 * Sections and pages, filtered by the reader's track (agent developers, treasury & risk,
 * protocol integrators). The track is remembered per browser.
 */
export function Sidebar() {
  const pathname = usePathname();
  const [track, setTrack] = useState<Track | "all">("all");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY) as Track | "all" | null;
      if (saved && TRACKS.some((t) => t.id === saved)) setTrack(saved);
    } catch {
      // Storage unavailable: show everything.
    }
  }, []);
  useEffect(() => setOpen(false), [pathname]);

  const pick = (t: Track | "all") => {
    setTrack(t);
    try {
      localStorage.setItem(KEY, t);
    } catch {
      // Not remembered; still filtered for this visit.
    }
  };

  return (
    <aside className={`dz-side${open ? " open" : ""}`} aria-label="Documentation">
      <button type="button" className="dz-menu tag" aria-expanded={open} onClick={() => setOpen((o) => !o)}>
        {open ? "Close menu" : "Menu"}
      </button>
      <div className="dz-side-in">
        <div className="dz-track">
          <label className="tag" htmlFor="dz-track">
            I am
          </label>
          <select id="dz-track" value={track} onChange={(e) => pick(e.target.value as Track | "all")}>
            {TRACKS.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id === "all" ? "Reading everything" : t.label}
              </option>
            ))}
          </select>
        </div>
        <nav>
          {SECTIONS.map((s) => {
            const pages = s.pages.filter((p) => track === "all" || p.tracks.includes(track));
            if (pages.length === 0) return null;
            return (
              <div key={s.title} className="dz-sec">
                <p className="tag">{s.title}</p>
                <ul>
                  {pages.map((p) => {
                    const href = `/docs/${p.slug}`;
                    const current = pathname === href;
                    return (
                      <li key={p.slug}>
                        <Link href={href} aria-current={current ? "page" : undefined} className={current ? "on" : undefined}>
                          {p.nav}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
