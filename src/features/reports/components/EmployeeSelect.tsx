"use client";

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
    <label className="flex flex-col gap-2 w-full sm:w-[280px]">
      <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/50">
        Employee
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        className="h-12 rounded-2xl border border-surfacestroke bg-surface px-4 text-sm font-medium text-foreground shadow-sm outline-none transition-colors focus:border-primary disabled:cursor-not-allowed disabled:opacity-60"
      >
        <option value="ALL">All Employees</option>
        {employees.map((employee) => (
          <option key={employee.id} value={employee.id}>
            {employee.name}
          </option>
        ))}
      </select>
    </label>
  );
}
