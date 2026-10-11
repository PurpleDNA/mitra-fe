"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

export interface SearchEntry {
  slug: string;
  title: string;
  section: string;
  headings: { id: string; text: string; depth: 2 | 3 }[];
}

interface Hit {
  key: string;
  href: string;
  label: string;
  where: string;
}

/** ⌘K / Ctrl+K: jump to any page or heading by typing words from it. */
export function Search({ index }: { index: SearchEntry[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen((o) => !o);
      } else if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
  useEffect(() => {
    if (open) {
      setQ("");
      setSel(0);
      setTimeout(() => input.current?.focus(), 0);
    }
  }, [open]);

  const hits = useMemo<Hit[]>(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    const all: Hit[] = index.flatMap((p) => [
      { key: p.slug, href: `/docs/${p.slug}`, label: p.title, where: p.section },
      ...p.headings.map((h) => ({ key: `${p.slug}#${h.id}`, href: `/docs/${p.slug}#${h.id}`, label: h.text, where: p.title })),
    ]);
    if (words.length === 0) return all.filter((h) => !h.key.includes("#")).slice(0, 16);
    return all.filter((h) => words.every((w) => `${h.label} ${h.where}`.toLowerCase().includes(w))).slice(0, 12);
  }, [q, index]);

  const go = (h: Hit | undefined) => {
    if (!h) return;
    setOpen(false);
    router.push(h.href);
  };

  return (
    <>
      <button type="button" className="dz-search-btn" onClick={() => setOpen(true)}>
        <span>Search docs</span>
        <kbd className="tag">⌘K</kbd>
      </button>
      {open ? (
        <div className="dz-pal-back" onClick={() => setOpen(false)}>
          <div
            className="dz-pal"
            role="dialog"
            aria-modal="true"
            aria-label="Search the documentation"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              ref={input}
              autoFocus
              value={q}
              placeholder="Search pages and headings"
              aria-label="Search pages and headings"
              onChange={(e) => {
                setQ(e.target.value);
                setSel(0);
              }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setSel((s) => Math.min(hits.length - 1, s + 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setSel((s) => Math.max(0, s - 1));
                } else if (e.key === "Enter") go(hits[sel]);
              }}
            />
            <ul>
              {hits.map((h, i) => (
                <li key={h.key}>
                  <button
                    type="button"
                    className={i === sel ? "on" : undefined}
                    onMouseEnter={() => setSel(i)}
                    onClick={() => go(h)}
                  >
                    <span>{h.label}</span>
                    <span className="tag">{h.where}</span>
                  </button>
                </li>
              ))}
              {hits.length === 0 ? <li className="dz-pal-none">Nothing matches “{q}”.</li> : null}
            </ul>
          </div>
        </div>
      ) : null}
    </>
  );
}
