"use client";

import Link from "next/link";
import { LayoutGrid, FileSpreadsheet } from "lucide-react";

import { BrandMark } from "@/components/BrandMark";

interface ManagerWorkspaceShellProps {
  qrToken: string;
  currentPath: `/dashboard/${string}` | `/reports/${string}`;
  children: React.ReactNode;
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

export function ManagerWorkspaceShell({
  qrToken,
  currentPath,
  children,
}: ManagerWorkspaceShellProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        <div className="overflow-hidden rounded-[32px] border border-surfacestroke bg-[color:color-mix(in_srgb,var(--color-bg-elevated)_72%,var(--color-surface))] shadow-[var(--shadow-panel)]">
          <div className="qr-grid-accent border-b border-surfacestroke px-5 py-4 sm:px-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-center justify-between gap-4">
                <BrandMark showWordmark={false} className="shrink-0" />
                <div className="min-w-0">
                  <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
                    Manager workspace
                  </p>
                  <p className="font-display text-xl font-bold tracking-[-0.04em] text-foreground">
                    QRShift
                  </p>
                </div>
              </div>

              <nav
                aria-label="Manager workspace"
                className="flex flex-wrap gap-2"
              >
                {navConfig.map((item) => {
                  const href = item.href(qrToken);
                  const active = currentPath === href || currentPath.startsWith(item.match);
                  const Icon = item.icon;

                  return (
                    <Link
                      key={item.label}
                      href={href}
                      className={`inline-flex min-h-11 items-center gap-2 rounded-[18px] border px-4 py-2 text-sm font-semibold transition-colors ${
                        active
                          ? "border-primary bg-primary text-white"
                          : "border-surfacestroke bg-surface text-foreground hover:border-border-strong hover:bg-background"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </nav>
            </div>
          </div>

          <main className="px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
