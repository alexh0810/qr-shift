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
}

export function ShiftStatusPanel({
  title,
  description,
  emptyMessage,
  icon: Icon,
  items,
}: ShiftStatusPanelProps) {
  const isActivePanel = items.some((item) => item.tone === "active");

  return (
    <WorkspacePanel
      title={title}
      description={description}
      headerActions={
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-[16px] ${
            isActivePanel ? "bg-success/12 text-success" : "bg-background text-text-muted"
          }`}
        >
          <Icon className="h-5 w-5" />
        </div>
      }
      bodyClassName="p-0"
    >
      {items.length === 0 ? (
        <div className="px-5 py-10 text-center text-sm font-medium text-text-muted sm:px-6">
          {emptyMessage}
        </div>
      ) : (
        <ul className="divide-y divide-surfacestroke">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-[18px] border ${
                    item.tone === "active"
                      ? "border-success/15 bg-success/10"
                      : "border-surfacestroke bg-background"
                  }`}
                >
                  <span
                    className={`text-base font-bold ${
                      item.tone === "active" ? "text-success" : "text-text-muted"
                    }`}
                  >
                    {item.name.charAt(0).toUpperCase()}
                  </span>
                </div>

                <div>
                  <p className="text-base font-bold text-foreground">{item.name}</p>
                  <p className="text-xs font-medium text-text-muted">{item.detail}</p>
                </div>
              </div>

              <span
                className={`inline-flex min-h-[44px] items-center justify-center rounded-full px-4 py-2 text-[11px] font-bold uppercase tracking-[0.24em] ${
                  item.tone === "active"
                    ? "bg-success text-white"
                    : "border border-surfacestroke bg-background text-text-muted"
                }`}
              >
                {item.tone === "active" ? item.statusLabel : <Circle className="h-4 w-4" />}
                {item.tone === "active" ? null : <span className="ml-2">{item.statusLabel}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </WorkspacePanel>
  );
}
