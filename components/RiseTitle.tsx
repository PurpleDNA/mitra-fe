"use client";

import { Fragment, useEffect, useRef, useState, type ElementType } from "react";

/**
 * A heading whose words rise into place the first time it scrolls into view — the
 * hero's motion, for every section heading.
 *
 * Server render (and no JavaScript): plain visible text. After hydration a heading
 * below the fold is hidden ("wait") until it enters view, then animates ("go") once.
 * Reduced motion skips the animation and shows the words in place.
 */
export function RiseTitle({
  as: Tag = "h2",
  text,
  id,
  className,
  accentFrom,
}: {
  as?: ElementType;
  text: string;
  id?: string;
  className?: string;
  /** Words from this index on take the accent colour. */
  accentFrom?: number;
}) {
  const ref = useRef<HTMLElement>(null);
  const [state, setState] = useState<"idle" | "wait" | "go">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) {
      setState("go");
      return;
    }
    setState("wait");
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setState("go");
          io.disconnect();
        }
      },
      { threshold: 0.35 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const words = text.split(" ");
  return (
    <Tag ref={ref} id={id} className={`rise rise-${state}${className ? ` ${className}` : ""}`}>
      {words.map((w, i) => (
        // The space sits between the word boxes: inside an inline-block it would collapse.
        <Fragment key={i}>
          <span className={`rise-w${accentFrom !== undefined && i >= accentFrom ? " rise-acc" : ""}`}>
            <span style={{ animationDelay: `${0.05 + i * 0.08}s` }}>{w}</span>
          </span>
          {i < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </Tag>
  );
}
