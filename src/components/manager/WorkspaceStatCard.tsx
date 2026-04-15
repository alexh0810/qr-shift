interface WorkspaceStatCardProps {
  label: string;
  value: React.ReactNode;
  description?: string;
  statusBadge?: React.ReactNode;
  icon?: React.ReactNode;
  className?: string;
  valueClassName?: string;
}

export function WorkspaceStatCard({
  label,
  value,
  description,
  statusBadge,
  icon,
  className = "",
  valueClassName = "",
}: WorkspaceStatCardProps) {
  return (
    <article
      className={`rounded-[24px] border border-surfacestroke bg-surface px-5 py-5 shadow-[var(--shadow-panel)] ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
            {label}
          </p>
          <p
            className={`mt-4 font-mono-brand text-3xl font-bold tracking-[-0.04em] text-foreground sm:text-[2rem] ${valueClassName}`.trim()}
          >
            {value}
          </p>
        </div>

        <div className="flex flex-col items-end gap-3">
          {icon ? (
            <div className="flex h-11 w-11 items-center justify-center rounded-[18px] border border-surfacestroke bg-background text-primary">
              {icon}
            </div>
          ) : null}
          {statusBadge ? <div>{statusBadge}</div> : null}
        </div>
      </div>

      {description ? (
        <p className="mt-3 text-sm font-medium leading-6 text-text-muted">{description}</p>
      ) : null}
    </article>
  );
}
