interface WorkspaceStatCardProps {
  label: string;
  value: React.ReactNode;
  description?: string;
  statusBadge?: React.ReactNode;
  icon?: React.ReactNode;
  compact?: boolean;
  className?: string;
  valueClassName?: string;
}

export function WorkspaceStatCard({
  label,
  value,
  description,
  statusBadge,
  icon,
  compact = false,
  className = "",
  valueClassName = "",
}: WorkspaceStatCardProps) {
  return (
    <article
      className={`rounded-[24px] border border-border-strong bg-surface ${compact ? "px-4 py-4" : "px-5 py-5"} shadow-[var(--shadow-panel)] ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
            {label}
          </p>
          <p
            className={`${compact ? "mt-3 text-[1.75rem] sm:text-[1.9rem]" : "mt-4 text-3xl sm:text-[2rem]"} font-mono-brand font-bold tracking-[-0.04em] text-foreground ${valueClassName}`.trim()}
          >
            {value}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          {icon ? (
            <div
              className={`flex items-center justify-center rounded-[18px] border border-surfacestroke bg-background text-primary ${
                compact ? "h-10 w-10" : "h-11 w-11"
              }`}
            >
              {icon}
            </div>
          ) : null}
          {statusBadge ? <div>{statusBadge}</div> : null}
        </div>
      </div>

      {description ? (
        <p className={`mt-3 font-medium text-text-muted ${compact ? "text-xs leading-5" : "text-sm leading-6"}`}>
          {description}
        </p>
      ) : null}
    </article>
  );
}
