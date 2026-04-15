"use client";

import { WorkspacePanel } from "@/components/manager/WorkspacePanel";
import { Employee } from "@/types";

interface EmployeeSelectProps {
  employees: Employee[];
  value: "ALL" | string;
  onChange: (value: "ALL" | string) => void;
  disabled?: boolean;
}

export function EmployeeSelect({
  employees,
  value,
  onChange,
  disabled = false,
}: EmployeeSelectProps) {
  return (
    <WorkspacePanel
      eyebrow="Employee filter"
      title="Switch between workspace and single-person review"
      description="Move between all rows and one employee detail view without leaving the shared manager workspace."
      className="rounded-[24px]"
      bodyClassName="pt-0"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <p className="text-sm font-semibold text-foreground">
          {employees.length} employee{employees.length === 1 ? "" : "s"}
        </p>
      </div>

      <label className="mt-4 flex w-full flex-col gap-2 sm:max-w-[320px]">
        <span className="text-[11px] font-bold uppercase tracking-[0.24em] text-text-muted">
          Employee
        </span>
        <select
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className="min-h-[44px] rounded-[18px] border border-surfacestroke bg-background px-4 py-3 text-sm font-semibold text-foreground outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
        >
          <option value="ALL">All Employees</option>
          {employees.map((employee) => (
            <option key={employee.id} value={employee.id}>
              {employee.name}
            </option>
          ))}
        </select>
      </label>
    </WorkspacePanel>
  );
}
