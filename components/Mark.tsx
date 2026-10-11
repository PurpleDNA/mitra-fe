/**
 * The Mitra mark ("Bound"), on a 48-unit grid. Brackets are the mandate, the pale
 * diamond is the vault, the blue core is the one instruction cleared to move.
 * `compact` drops the vault, which vanishes below 24px. Source files: public/brand/.
 */
export function Mark({ compact = false, className }: { compact?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true" focusable="false">
      {!compact && <path d="M24 5.5 42.5 24 24 42.5 5.5 24z" style={{ fill: "var(--accent-tint)" }} />}
      <path d="M24 16 32 24 24 32 16 24z" style={{ fill: "var(--accent)" }} />
      <path
        d="M5.5 16V5.5H16M32 5.5h10.5V16M42.5 32v10.5H32M16 42.5H5.5V32"
        fill="none"
        strokeWidth="3"
        style={{ stroke: "var(--ink)" }}
      />
    </svg>
  );
}
