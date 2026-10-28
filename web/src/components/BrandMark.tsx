interface BrandMarkProps {
  className?: string;
  showWordmark?: boolean;
}

export function BrandMark({
  className = "",
  showWordmark = true,
}: BrandMarkProps) {
  return (
    <div className={`inline-flex items-center gap-3 ${className}`.trim()}>
      <div className="qr-grid-accent relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-[18px] border border-border-strong bg-surface shadow-[var(--shadow-panel)]">
        <span className="absolute left-2 top-2 h-2.5 w-2.5 rounded-[4px] bg-primary" />
        <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-[4px] bg-primary" />
        <span className="absolute bottom-2 left-2 h-2.5 w-2.5 rounded-[4px] bg-secondary" />
        <span className="absolute bottom-2 right-2 h-2.5 w-2.5 rounded-[4px] bg-primary" />
        <span className="absolute h-3 w-3 rounded-[5px] bg-foreground" />
      </div>
      {showWordmark ? (
        <div className="leading-none">
          <p className="font-display text-lg font-bold tracking-[-0.04em] text-foreground">
            QRShift
          </p>
          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-text-muted">
            Scan. Track. Export.
          </p>
        </div>
      ) : null}
    </div>
  );
}
