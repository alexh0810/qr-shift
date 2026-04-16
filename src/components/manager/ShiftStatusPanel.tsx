"use client";

import { Circle, type LucideIcon } from "lucide-react";

import { WorkspacePanel } from "@/components/manager/WorkspacePanel";

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
  description,
  emptyMessage,
  icon: Icon,
  items,
  statusBadge,
  compact = false,
}: ShiftStatusPanelProps) {
  const isActivePanel = items.some((item) => item.tone === "active");

  return (
    <WorkspacePanel
      title={title}
      description={description}
      statusBadge={statusBadge}
      headerActions={
        <div
          className={`flex items-center justify-center ${
            compact ? "h-8 w-8 rounded-[12px]" : "h-9 w-9 rounded-[14px]"
          } ${
            isActivePanel ? "bg-success/12 text-success" : "bg-background text-text-muted"
          }`}
        >
          <Icon className={compact ? "h-4 w-4" : "h-5 w-5"} />
        </div>
      }
      bodyClassName="p-0"
      compact={compact}
    >
      {items.length === 0 ? (
        <div
          className={`text-center font-medium text-text-muted ${
            compact ? "px-4 py-6 text-xs sm:text-sm" : "px-5 py-10 text-sm sm:px-6"
          }`}
        >
          {emptyMessage}
        </div>
      ) : (
        <ul className="divide-y divide-surfacestroke">
          {items.map((item) => (
            <li
              key={item.id}
              className={`flex min-w-0 flex-col gap-2.5 md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-3 ${
                compact ? "px-3 py-3 sm:px-4" : "px-4 py-4 md:px-5"
              }`}
            >
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex shrink-0 items-center justify-center border ${
                    compact ? "h-9 w-9 rounded-[12px]" : "h-11 w-11 rounded-[16px]"
                  } ${
                    item.tone === "active"
                      ? "border-success/15 bg-success/10"
                      : "border-surfacestroke bg-background"
                  }`}
                >
                  <span
                    className={`${compact ? "text-sm" : "text-base"} font-bold ${
                      item.tone === "active" ? "text-success" : "text-text-muted"
                    }`}
                  >
                    {item.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div className="min-w-0">
                  <p className={`${compact ? "text-sm" : "text-base"} font-bold text-foreground`}>
                    {item.name}
                  </p>
                  <p
                    className={`truncate font-medium text-text-muted ${
                      compact ? "text-[11px]" : "text-xs"
                    }`}
                  >
                    {item.detail}
                  </p>
                </div>
              </div>

              <span
                className={`inline-flex self-start items-center justify-center rounded-full font-bold uppercase tracking-[0.24em] md:justify-self-end ${
                  compact ? "min-h-[34px] px-2.5 py-1.5 text-[10px]" : "min-h-[40px] px-3 py-2 text-[11px]"
                } ${
                  item.tone === "active"
                    ? "bg-success text-white"
                    : "border border-surfacestroke bg-background text-text-muted"
                }`}
              >
                {item.tone === "active" ? (
                  item.statusLabel
                ) : (
                  <Circle className={compact ? "h-3.5 w-3.5" : "h-4 w-4"} />
                )}
                {item.tone === "active" ? null : (
                  <span className={compact ? "ml-1.5" : "ml-2"}>{item.statusLabel}</span>
                )}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WorkspacePanel>
  );
}
