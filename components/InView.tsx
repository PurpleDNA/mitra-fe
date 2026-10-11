"use client";

import { useEffect, useRef, useState, type ElementType, type ReactNode } from "react";

/**
 * Marks a section with data-inview so its CSS animations run only while it is on
 * screen (see globals.css). Before hydration the attribute is absent and animations
 * run, so the page still works without JavaScript.
 */
export function InView({
  as: Tag = "section",
  className,
  id,
  threshold = 0.2,
  children,
  "aria-labelledby": labelledBy,
}: {
  as?: ElementType;
  className?: string;
  id?: string;
  threshold?: number;
  children: ReactNode;
  "aria-labelledby"?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  const [inView, setInView] = useState<boolean | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), { threshold });
    io.observe(el);
    return () => io.disconnect();
  }, [threshold]);

  return (
    <Tag
      ref={ref}
      id={id}
      className={className}
      aria-labelledby={labelledBy}
      data-inview={inView === null ? undefined : String(inView)}
    >
      {children}
    </Tag>
  );
}
