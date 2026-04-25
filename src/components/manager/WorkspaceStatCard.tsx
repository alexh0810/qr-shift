import type { LucideIcon } from "lucide-react";

interface WorkspaceStatCardProps {
  label: string;
  value: React.ReactNode;
  icon?: LucideIcon;
  trend?: "up" | "down" | "neutral";
  variant?: "default" | "primary" | "success";
  className?: string;
}

const variantStyles = {
  default: {
    bg: "bg-background",
    iconBg: "bg-surface",
    iconColor: "text-muted",
  },
  primary: {
    bg: "bg-primary-light",
    iconBg: "bg-primary/10",
    iconColor: "text-primary",
  },
  success: {
    bg: "bg-success-light",
    iconBg: "bg-success/10",
    iconColor: "text-success",
  },
};

export function WorkspaceStatCard({
  label,
  value,
  icon: Icon,
  variant = "default",
  className = "",
}: WorkspaceStatCardProps) {
  const styles = variantStyles[variant];
  
  return (
    <article
      className={`rounded-xl border border-border ${styles.bg} p-5 transition-all hover:shadow-sm ${className}`.trim()}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-muted">{label}</p>
          <p className="mt-1.5 font-display text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
        </div>
        {Icon ? (
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${styles.iconBg}`}>
            <Icon className={`h-5 w-5 ${styles.iconColor}`} />
          </div>
        ) : null}
      </div>
    </article>
  );
}
