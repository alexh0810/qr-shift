interface WorkspacePanelProps {
  title?: string;
  description?: string;
  headerActions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}

export function WorkspacePanel({
  title,
  description,
  headerActions,
  children,
  className = "",
  bodyClassName = "",
}: WorkspacePanelProps) {
  const hasHeader = title || headerActions;

  return (
    <section
      className={`overflow-hidden rounded-xl border border-border bg-background shadow-sm ${className}`.trim()}
    >
      {hasHeader ? (
        <div className="flex items-center justify-between gap-4 border-b border-border bg-surface px-5 py-4">
          <div>
            {title ? (
              <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
            ) : null}
            {description ? (
              <p className="mt-0.5 text-sm text-muted">{description}</p>
            ) : null}
          </div>
          {headerActions ? (
            <div className="flex items-center gap-2">{headerActions}</div>
          ) : null}
        </div>
      ) : null}

      <div className={`p-5 ${bodyClassName}`.trim()}>
        {children}
      </div>
    </section>
  );
}
