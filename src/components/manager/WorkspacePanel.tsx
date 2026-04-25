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
  title,
  headerActions,
  children,
  className = "",
  bodyClassName = "",
}: WorkspacePanelProps) {
  const hasHeader = title || headerActions;

  return (
    <section
      className={`rounded-xl border border-border bg-background ${className}`.trim()}
    >
      {hasHeader ? (
        <div className="flex items-center justify-between gap-4 border-b border-border px-5 py-4">
          {title ? (
            <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          ) : null}
          {headerActions ? (
            <div className="flex items-center gap-2">{headerActions}</div>
          ) : null}
        </div>
      ) : null}

      <div className={`px-5 py-5 ${bodyClassName}`.trim()}>
        {children}
      </div>
    </section>
  );
}
