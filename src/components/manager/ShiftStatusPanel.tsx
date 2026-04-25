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
  description?: string;
  emptyMessage: string;
  icon?: LucideIcon;
  items: ShiftStatusItem[];
  variant?: "active" | "idle";
}

export function ShiftStatusPanel({
  title,
  description,
  items,
  emptyMessage,
  icon: Icon,
  variant = "idle",
}: ShiftStatusPanelProps) {
  const isActive = variant === "active";
  
  return (
    <section className="overflow-hidden rounded-xl border border-border bg-background shadow-sm">
      {/* Header */}
      <div className={`flex items-center justify-between px-5 py-4 ${isActive ? "bg-success-light" : "bg-surface"}`}>
        <div className="flex items-center gap-3">
          {Icon ? (
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${isActive ? "bg-success/10" : "bg-background"}`}>
              <Icon className={`h-4 w-4 ${isActive ? "text-success" : "text-muted"}`} />
            </div>
          ) : null}
          <div>
            <h2 className="font-display text-base font-semibold text-foreground">{title}</h2>
            {description ? (
              <p className="text-xs text-muted">{description}</p>
            ) : null}
          </div>
        </div>
        <span className={`rounded-full px-3 py-1 text-sm font-semibold ${
          isActive 
            ? "bg-success/10 text-success" 
            : "bg-muted/10 text-muted"
        }`}>
          {items.length}
        </span>
      </div>

      {/* Content */}
      {items.length === 0 ? (
        <div className="px-5 py-12 text-center">
          <p className="text-sm text-muted">{emptyMessage}</p>
        </div>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-surface/50"
            >
              <div className="flex min-w-0 items-center gap-3">
                {/* Avatar */}
                <div
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-display text-sm font-semibold ${
                    item.tone === "active"
                      ? "bg-success-light text-success"
                      : "bg-surface text-muted"
                  }`}
                >
                  {item.name.charAt(0).toUpperCase()}
                </div>
                {/* Info */}
                <div className="min-w-0">
                  <p className="truncate font-medium text-foreground">{item.name}</p>
                  <p className="truncate text-sm text-muted">{item.detail}</p>
                </div>
              </div>

              {/* Status badge */}
              <span
                className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${
                  item.tone === "active"
                    ? "bg-success-light text-success"
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
