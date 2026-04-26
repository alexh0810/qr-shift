"use client";

import Link from "next/link";
import { FileSpreadsheet, LayoutGrid } from "lucide-react";

import { BrandMark } from "@/components/BrandMark";
import type { ManagerWorkspaceNavItem } from "@/components/manager/ManagerWorkspaceHeader";

interface ManagerWorkspaceShellProps {
  qrToken?: string;
  currentPath?: `/dashboard/${string}` | `/reports/${string}`;
  navItems?: ManagerWorkspaceNavItem[];
  workspaceLabel?: string;
  workspaceName?: string;
  utilitySlot?: React.ReactNode;
  children: React.ReactNode;
  frameClassName?: string;
  contentClassName?: string;
}

const navConfig = [
  {
    label: "Dashboard",
    href: (qrToken: string) => `/dashboard/${qrToken}`,
    icon: LayoutGrid,
    match: "/dashboard/",
  },
  {
    label: "Reports",
    href: (qrToken: string) => `/reports/${qrToken}`,
    icon: FileSpreadsheet,
    match: "/reports/",
  },
] as const;

function buildDefaultNavItems(
  qrToken: string,
  currentPath: `/dashboard/${string}` | `/reports/${string}`,
): ManagerWorkspaceNavItem[] {
  return navConfig.map((item) => {
    const href = item.href(qrToken);

    return {
      label: item.label,
      href,
      active: currentPath === href || currentPath.startsWith(item.match),
    };
  });
}

export function ManagerWorkspaceShell({
  qrToken,
  currentPath,
  navItems,
  workspaceLabel = "Dashboard",
  workspaceName = "QRShift",
  utilitySlot,
  children,
  frameClassName = "",
  contentClassName = "",
}: ManagerWorkspaceShellProps) {
  const resolvedNavItems =
    navItems ?? (qrToken && currentPath ? buildDefaultNavItems(qrToken, currentPath) : []);
  const hasNavigation = resolvedNavItems.length > 0;

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(36,92,255,0.08),transparent_42%),var(--color-background)]">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-2 py-3 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div
          className={`overflow-hidden rounded-[28px] border border-border-strong bg-[color:color-mix(in_srgb,var(--color-bg-elevated)_78%,var(--color-surface))] shadow-[var(--shadow-panel)] sm:rounded-[32px] ${frameClassName}`.trim()}
        >
          <div className="qr-grid-accent border-b border-surfacestroke px-4 py-4 sm:px-6 sm:py-5">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex min-w-0 items-center gap-3">
                    <BrandMark showWordmark={false} className="shrink-0" />
                    <div className="min-w-0">
                      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                        {workspaceLabel}
                      </p>
                      <p className="truncate font-display text-xl font-bold tracking-[-0.04em] text-foreground">
                        {workspaceName}
                      </p>
                    </div>
                  </div>
                </div>

                {utilitySlot ? (
                  <div className="flex flex-wrap justify-start gap-2 lg:justify-end">{utilitySlot}</div>
                ) : null}
              </div>

              {hasNavigation ? (
                <div className="flex flex-wrap gap-2">
                  <nav
                    aria-label="Manager navigation"
                    className="flex flex-wrap gap-2"
                  >
                    {resolvedNavItems.map((item) => {
                      const matchedConfig = navConfig.find((entry) => entry.label === item.label);
                      const Icon = matchedConfig?.icon;

                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          aria-current={item.active ? "page" : undefined}
                          className={`inline-flex min-h-11 items-center gap-2 rounded-[18px] border px-4 py-2 text-sm font-semibold transition-colors ${
                            item.active
                              ? "border-primary bg-primary text-white shadow-[0_10px_24px_rgba(36,92,255,0.18)]"
                              : "border-surfacestroke bg-background/85 text-foreground hover:border-border-strong hover:bg-surface"
                          }`}
                        >
                          {Icon ? <Icon className="h-4 w-4" /> : null}
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                </div>
              ) : null}
            </div>
          </div>

          <main className={`px-3 py-4 sm:px-6 sm:py-6 lg:px-8 lg:py-8 ${contentClassName}`.trim()}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
