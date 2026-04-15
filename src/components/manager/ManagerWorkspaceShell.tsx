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
  workspaceLabel = "Manager workspace",
  workspaceName = "QRShift",
  utilitySlot,
  children,
  frameClassName = "",
  contentClassName = "",
}: ManagerWorkspaceShellProps) {
  const resolvedNavItems =
    navItems ?? (qrToken && currentPath ? buildDefaultNavItems(qrToken, currentPath) : []);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div
          className={`overflow-hidden rounded-[32px] border border-surfacestroke bg-[color:color-mix(in_srgb,var(--color-bg-elevated)_72%,var(--color-surface))] shadow-[var(--shadow-panel)] ${frameClassName}`.trim()}
        >
          <div className="qr-grid-accent border-b border-surfacestroke px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center justify-between gap-4">
                <BrandMark showWordmark={false} className="shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                    {workspaceLabel}
                  </p>
                  <p className="font-display text-xl font-bold tracking-[-0.04em] text-foreground">
                    {workspaceName}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3 lg:items-end">
                {utilitySlot ? <div>{utilitySlot}</div> : null}
                {resolvedNavItems.length > 0 ? (
                  <nav
                    aria-label="Manager workspace"
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
                              ? "border-primary bg-primary text-white"
                              : "border-surfacestroke bg-surface text-foreground hover:border-border-strong hover:bg-background"
                          }`}
                        >
                          {Icon ? <Icon className="h-4 w-4" /> : null}
                          <span>{item.label}</span>
                        </Link>
                      );
                    })}
                  </nav>
                ) : null}
              </div>
            </div>
          </div>

          <main className={`px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8 ${contentClassName}`.trim()}>
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
