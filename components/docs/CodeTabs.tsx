"use client";

import { Children, isValidElement, useEffect, useState, type ReactElement, type ReactNode } from "react";

const KEY = "mitra-docs-lang";
const EVENT = "mitra-docs-lang";

/** One tab's content. Rendered by CodeTabs; on its own it is just its children. */
export function CodeTab({ children }: { label?: string; children?: ReactNode }) {
  return <>{children}</>;
}

/**
 * Language tabs for a code sample. The chosen language is remembered and applied to
 * every tab group on every page, the way Stripe's docs do it.
 */
export function CodeTabs({ children }: { children?: ReactNode }) {
  const tabs = Children.toArray(children).filter(isValidElement) as ReactElement<{ label?: string; children?: ReactNode }>[];
  const labels = tabs.map((t) => t.props.label ?? "Code");
  const [active, setActive] = useState(0);

  useEffect(() => {
    const apply = (lang: string | null) => {
      const i = lang ? labels.indexOf(lang) : -1;
      if (i >= 0) setActive(i);
    };
    try {
      apply(localStorage.getItem(KEY));
    } catch {
      // Storage can be unavailable (private mode); the first tab stays selected.
    }
    const on = (e: Event) => apply((e as CustomEvent<string>).detail);
    window.addEventListener(EVENT, on);
    return () => window.removeEventListener(EVENT, on);
    // labels are derived from children, which do not change after render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const choose = (i: number) => {
    setActive(i);
    try {
      localStorage.setItem(KEY, labels[i]);
    } catch {
      // Not remembered, but the switch still happens here.
    }
    window.dispatchEvent(new CustomEvent(EVENT, { detail: labels[i] }));
  };

  return (
    <div className="dz-tabs">
      <div className="dz-tablist" role="tablist" aria-label="Code language">
        {labels.map((l, i) => (
          <button
            key={l}
            type="button"
            role="tab"
            aria-selected={i === active}
            className={i === active ? "on" : undefined}
            onClick={() => choose(i)}
          >
            {l}
          </button>
        ))}
      </div>
      {tabs.map((t, i) => (
        <div key={labels[i]} role="tabpanel" hidden={i !== active}>
          {t.props.children}
        </div>
      ))}
    </div>
  );
}
