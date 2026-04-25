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
  utilitySlot,
  children,
  frameClassName = "",
  contentClassName = "",
}: ManagerWorkspaceShellProps) {
  const resolvedNavItems =
    navItems ?? (qrToken && currentPath ? buildDefaultNavItems(qrToken, currentPath) : []);
  const hasNavigation = resolvedNavItems.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col">
        {/* Top nav bar */}
        <header className="sticky top-0 z-10 border-b border-border bg-background/95 backdrop-blur-sm">
          <div className="flex h-14 items-center justify-between px-5 sm:px-6 lg:px-8">
            <div className="flex items-center gap-6">
              <BrandMark />
              {hasNavigation ? (
                <nav aria-label="Manager workspace" className="flex items-center gap-1">
                  {resolvedNavItems.map((item) => {
                    const matchedConfig = navConfig.find((entry) => entry.label === item.label);
                    const Icon = matchedConfig?.icon;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        aria-current={item.active ? "page" : undefined}
                        className={`inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                          item.active
                            ? "bg-primary/10 text-primary"
                            : "text-muted hover:bg-surface hover:text-foreground"
                        }`}
                      >
                        {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
                        <span>{item.label}</span>
                      </Link>
                    );
                  })}
                </nav>
              ) : null}
            </div>

            {utilitySlot ? (
              <div className="flex items-center gap-2">{utilitySlot}</div>
            ) : null}
          </div>
        </header>

        <main className={`flex-1 px-5 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10 ${contentClassName} ${frameClassName}`.trim()}>
          {children}
        </main>
      </div>
    </div>
  );
}
