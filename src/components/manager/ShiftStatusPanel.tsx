"use client";

import type { LucideIcon } from "lucide-react";

interface ShiftStatusItem {
  id: string;
  name: string;
  detail: string;
  statusLabel: string;
  tone: "active" | "idle";
}

interface ShiftStatusPanelProps {
  title: string;
  description: string;
  emptyMessage: string;
  icon: LucideIcon;
  items: ShiftStatusItem[];
  statusBadge?: React.ReactNode;
  compact?: boolean;
}

export function ShiftStatusPanel({
  title,
  items,
  emptyMessage,
  compact = false,
}: ShiftStatusPanelProps) {
  return (
    <section className="rounded-xl border border-border bg-background">
      <div className="flex items-center justify-between border-b border-border px-5 py-4">
        <h2 className="text-sm font-semibold text-foreground">{title}</h2>
        <span className="rounded-full bg-surface px-2.5 py-0.5 text-xs font-medium text-muted">
          {items.length}
        </span>
      </div>

      {items.length === 0 ? (
        <p className={`text-center text-sm text-muted ${compact ? "px-5 py-8" : "px-5 py-12"}`}>
          {emptyMessage}
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex items-center justify-between gap-4 ${compact ? "px-4 py-3" : "px-5 py-3.5"}`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                    item.tone === "active"
                      ? "bg-success/10 text-success"
                      : "bg-surface text-muted"
                  }`}
                >
                  {item.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-foreground">{item.name}</p>
                  <p className="truncate text-xs text-muted">{item.detail}</p>
                </div>
              </div>

              <span
                className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                  item.tone === "active"
                    ? "bg-success/10 text-success"
                    : "bg-surface text-muted"
                }`}
              >
                {item.statusLabel}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
