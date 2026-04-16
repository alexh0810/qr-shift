interface WorkspacePanelProps {
  eyebrow?: string;
  title?: string;
  description?: string;
  statusBadge?: React.ReactNode;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  compact?: boolean;
}

export function WorkspacePanel({
  eyebrow,
  title,
  description,
  statusBadge,
  headerActions,
  children,
  className = "",
  bodyClassName = "",
  compact = false,
}: WorkspacePanelProps) {
  const hasHeader = eyebrow || title || description || statusBadge || headerActions;

  return (
    <section
      className={`rounded-[28px] border border-border-strong bg-surface shadow-[var(--shadow-panel)] ${className}`.trim()}
    >
      {hasHeader ? (
        <div
          className={`flex flex-col gap-3 border-b border-surfacestroke ${
            compact ? "px-4 py-4 sm:px-4" : "px-5 py-5 sm:px-6"
          }`}
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="space-y-2">
              {eyebrow ? (
                <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                  {eyebrow}
                </p>
              ) : null}
              {title ? (
                <div className="flex flex-wrap items-center gap-3">
                  <h2
                    className={`font-bold tracking-[-0.03em] text-foreground ${
                      compact ? "text-lg sm:text-xl" : "text-xl sm:text-2xl"
                    }`}
                  >
                    {title}
                  </h2>
                  {statusBadge ? <div>{statusBadge}</div> : null}
                </div>
              ) : null}
              {description ? (
                <p
                  className={`max-w-2xl font-medium text-text-muted ${
                    compact ? "text-xs leading-5 sm:text-sm" : "text-sm leading-6"
                  }`}
                >
                  {description}
                </p>
              ) : null}
            </div>

            {headerActions ? (
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
                {headerActions}
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      <div
        className={`${compact ? "px-4 py-4 sm:px-4" : "px-5 py-5 sm:px-6"} ${bodyClassName}`.trim()}
      >
        {children}
      </div>
    </section>
  );
}
