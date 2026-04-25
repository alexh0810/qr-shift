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
  compact = false,
  className = "",
  valueClassName = "",
}: WorkspaceStatCardProps) {
  return (
    <article
      className={`rounded-xl border border-border bg-background px-5 py-4 ${className}`.trim()}
    >
      <p className="text-xs font-medium text-muted">{label}</p>
      <p
        className={`mt-1.5 font-mono-brand font-semibold tracking-tight text-foreground ${
          compact ? "text-2xl" : "text-3xl"
        } ${valueClassName}`.trim()}
      >
        {value}
      </p>
    </article>
  );
}
