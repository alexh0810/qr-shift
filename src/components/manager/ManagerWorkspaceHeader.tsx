import { ArrowRight } from "lucide-react";
import Link from "next/link";

interface HeaderLinkAction {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

type HeaderAction = React.ReactNode | HeaderLinkAction;

export interface ManagerWorkspaceNavItem {
  label: string;
  href: string;
}

interface ManagerWorkspaceHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  navItems?: ManagerWorkspaceNavItem[];
  primaryAction?: HeaderAction;
  secondaryAction?: HeaderAction;
  statusBadge?: React.ReactNode;
}

function isHeaderLinkAction(action: HeaderAction): action is HeaderLinkAction {
  return (
    typeof action === "object" &&
    action !== null &&
    "label" in action &&
    "href" in action
  );
}

function renderAction(action?: HeaderAction, tone: "primary" | "secondary" = "secondary") {
  if (!action) {
    return null;
  }

  if (isHeaderLinkAction(action)) {
    return (
      <Link
        href={action.href}
        className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-[18px] border px-4 py-2 text-sm font-semibold transition-colors ${
          tone === "primary"
            ? "border-primary bg-primary text-white hover:bg-primary-dark"
            : "border-surfacestroke bg-surface text-foreground hover:border-border-strong hover:bg-background"
        }`}
      >
        {action.icon ?? <ArrowRight className="h-4 w-4" />}
        <span>{action.label}</span>
      </Link>
    );
  }

  return action;
}

export function ManagerWorkspaceHeader({
  eyebrow,
  title,
  description,
  navItems,
  primaryAction,
  secondaryAction,
  statusBadge,
}: ManagerWorkspaceHeaderProps) {
  return (
    <header className="rounded-[28px] border border-surfacestroke bg-surface px-5 py-5 shadow-[var(--shadow-panel)] sm:px-6 sm:py-6">
      <div className="flex flex-col gap-5">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl space-y-3">
            {eyebrow ? (
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                {eyebrow}
              </p>
            ) : null}
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <h1 className="font-display text-[clamp(2rem,4vw,2.5rem)] font-bold tracking-[-0.05em] text-foreground">
                  {title}
                </h1>
                {statusBadge ? <div>{statusBadge}</div> : null}
              </div>
              {description ? (
                <p className="max-w-xl text-sm font-medium leading-6 text-text-muted sm:text-base">
                  {description}
                </p>
              ) : null}
            </div>
          </div>

          {(secondaryAction || primaryAction) ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:justify-end">
              {renderAction(secondaryAction, "secondary")}
              {renderAction(primaryAction, "primary")}
            </div>
          ) : null}
        </div>

        {navItems && navItems.length > 0 ? (
          <div className="flex flex-wrap gap-2 border-t border-surfacestroke pt-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-[18px] border border-surfacestroke bg-background px-4 py-2 text-sm font-semibold text-foreground transition-colors hover:border-border-strong hover:bg-surface"
              >
                {item.label}
              </Link>
            ))}
          </div>
        ) : null}
      </div>
    </header>
  );
}
