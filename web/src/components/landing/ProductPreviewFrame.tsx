interface ProductPreviewFrameProps {
  label: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
}

export function ProductPreviewFrame({
  label,
  description,
  className = "",
  children,
}: ProductPreviewFrameProps) {
  return (
    <div
      className={`relative overflow-hidden rounded-[30px] border border-border-strong bg-background/90 p-3 shadow-[var(--shadow-panel)] sm:p-4 ${className}`.trim()}
    >
      <div className="absolute inset-x-0 top-0 h-20 bg-[radial-gradient(circle_at_top,rgba(36,92,255,0.22),transparent_68%)]" />
      <div className="relative overflow-hidden rounded-[26px] border border-surfacestroke bg-surface">
        <div className="flex flex-col gap-1.5 border-b border-surfacestroke px-4 py-3.5 sm:px-5">
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
            {label}
          </p>
          {description ? (
            <p className="text-sm font-medium leading-5 text-text-muted">{description}</p>
          ) : null}
        </div>
        <div className="bg-[linear-gradient(180deg,rgba(244,247,251,0.4),rgba(244,247,251,0))] p-4 sm:p-5">
          {children}
        </div>
      </div>
    </div>
  );
}
