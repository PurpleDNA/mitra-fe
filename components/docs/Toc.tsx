"use client";

import { useEffect, useState } from "react";
import type { TocItem } from "@/lib/docs/render";

/** "On this page", highlighting the heading the reader is currently in. */
export function Toc({ items }: { items: TocItem[] }) {
  const [current, setCurrent] = useState<string | null>(items[0]?.id ?? null);

  useEffect(() => {
    if (items.length === 0 || typeof IntersectionObserver === "undefined") return;
    const els = items.map((i) => document.getElementById(i.id)).filter((e): e is HTMLElement => e !== null);
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setCurrent(visible[0].target.id);
      },
      { rootMargin: "-80px 0px -65% 0px" },
    );
    els.forEach((e) => io.observe(e));
    return () => io.disconnect();
  }, [items]);

  if (items.length === 0) return null;
  return (
    <nav className="dz-toc" aria-label="On this page">
      <p className="tag">On this page</p>
      <ul>
        {items.map((i) => (
          <li key={i.id} className={i.depth === 3 ? "sub" : undefined}>
            <a href={`#${i.id}`} className={current === i.id ? "on" : undefined}>
              {i.text}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
