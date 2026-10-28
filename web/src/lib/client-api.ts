"use client";

import {
  DashboardSnapshotDto,
  OwnerStoreRosterDto,
  OwnerStoreListDto,
  ReportsSnapshotDto,
  ScanRosterDto,
  SerializedEmployee,
  SerializedOwnerStoreSummary,
  SerializedScanEmployeeStatus,
  SerializedTimelog,
  StoreLookupDto,
} from "@/lib/api-types";
import type { TimesheetRow } from "@/features/reports/types";
import { DashboardEmployeeStatus, Employee, OwnerStoreSummary, PublicStore, ScanEmployeeStatus, Timelog } from "@/types";

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Request failed");
  }

  return (await response.json()) as T;
}

function parseEmployee(employee: SerializedEmployee): Employee {
  return {
    ...employee,
    created_at: new Date(employee.created_at),
  };
}

function parseTimelog(timelog: SerializedTimelog): Timelog {
  return {
    ...timelog,
    timestamp: new Date(timelog.timestamp),
  };
}

function parseOwnerStoreSummary(store: SerializedOwnerStoreSummary): OwnerStoreSummary {
  return {
    ...store,
    created_at: new Date(store.created_at),
  };
}

function parseScanEmployeeStatus(record: SerializedScanEmployeeStatus): ScanEmployeeStatus {
  return {
    employee: parseEmployee(record.employee),
    latestLog: record.latest_log ? parseTimelog(record.latest_log) : null,
    status: record.status,
  };
}

export async function getPublicStore(qrToken: string): Promise<PublicStore> {
  const response = await fetch(`/api/stores/${qrToken}`, {
    credentials: "same-origin",
  });
  const payload = await readJson<StoreLookupDto>(response);
  return payload.store;
}

export async function getScanRoster(qrToken: string) {
  const response = await fetch(`/api/stores/${qrToken}/employees`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload = await readJson<ScanRosterDto>(response);
  return {
    store: payload.store,
    employees: payload.employees.map(parseScanEmployeeStatus),
  };
}

export async function submitClockAction(
  qrToken: string,
  employeeId: string,
  requestedAction: "IN" | "OUT",
) {
  const response = await fetch(`/api/stores/${qrToken}/clock`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      employeeId,
      requestedAction,
    }),
  });

  return readJson<{ action: "IN" | "OUT"; timestamp: string }>(response);
}

export async function getManagerSession(qrToken: string) {
  const response = await fetch(`/api/manager/session?qr_token=${encodeURIComponent(qrToken)}`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  return readJson<{ authenticated: boolean }>(response);
}

export async function loginManager(qrToken: string, pin: string) {
  const response = await fetch("/api/manager/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      qr_token: qrToken,
      pin,
    }),
  });

  return readJson<{ ok: true }>(response);
}

export async function logoutManager() {
  const response = await fetch("/api/manager/session", {
    method: "DELETE",
    credentials: "same-origin",
  });

  return readJson<{ ok: true }>(response);
}

export async function getOwnerSession() {
  const response = await fetch("/api/admin/session", {
    credentials: "same-origin",
    cache: "no-store",
  });
  return readJson<{ authenticated: boolean }>(response);
}

export async function getOwnerStores() {
  const response = await fetch("/api/admin/stores", {
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload = await readJson<OwnerStoreListDto>(response);
  return payload.stores.map(parseOwnerStoreSummary);
}

export async function loginOwner(secret: string) {
  const response = await fetch("/api/admin/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      secret,
    }),
  });

  return readJson<{ ok: true }>(response);
}

export async function logoutOwner() {
  const response = await fetch("/api/admin/session", {
    method: "DELETE",
    credentials: "same-origin",
  });

  return readJson<{ ok: true }>(response);
}

export async function createStore(
  storeName: string,
  pin: string,
  employeeNames: string[],
) {
  const response = await fetch("/api/admin/stores", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      storeName,
      pin,
      employeeNames,
    }),
  });

  return readJson<{ storeId: string; storeName: string; qrToken: string }>(response);
}

export async function createDemoStore() {
  const response = await fetch("/api/admin/demo-store", {
    method: "POST",
    credentials: "same-origin",
  });

  return readJson<{ storeId: string; storeName: string; qrToken: string; pin: string }>(response);
}

export async function getOwnerStoreRoster(storeId: string): Promise<{
  store: OwnerStoreSummary;
  employees: Employee[];
}> {
  const response = await fetch(`/api/admin/stores/${storeId}/employees`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload = await readJson<OwnerStoreRosterDto>(response);
  return {
    store: parseOwnerStoreSummary(payload.store),
    employees: payload.employees.map(parseEmployee),
  };
}

export async function createStoreEmployee(storeId: string, name: string) {
  const response = await fetch(`/api/admin/stores/${storeId}/employees`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ name }),
  });

  return readJson<{ employee: SerializedEmployee }>(response);
}

export async function updateStoreEmployee(
  storeId: string,
  employeeId: string,
  payload: { name?: string; status?: "active" | "archived" },
) {
  const response = await fetch(`/api/admin/stores/${storeId}/employees/${employeeId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify(payload),
  });

  return readJson<{ employee: SerializedEmployee }>(response);
}

export async function getDashboardSnapshot(qrToken: string): Promise<{
  store: PublicStore;
  employees: DashboardEmployeeStatus[];
}> {
  const response = await fetch(`/api/manager/${qrToken}/dashboard`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload = await readJson<DashboardSnapshotDto>(response);
  return {
    store: payload.store,
    employees: payload.employees.map(parseScanEmployeeStatus) as DashboardEmployeeStatus[],
  };
}

export async function getReportsSnapshot(qrToken: string): Promise<{
  store: PublicStore;
  employees: Employee[];
  timelogs: Timelog[];
}> {
  const response = await fetch(`/api/manager/${qrToken}/reports`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload = await readJson<ReportsSnapshotDto>(response);
  return {
    store: payload.store,
    employees: payload.employees.map(parseEmployee),
    timelogs: payload.timelogs.map(parseTimelog),
  };
}

export async function saveReportCorrection(
  qrToken: string,
  row: TimesheetRow,
) {
  const response = await fetch(`/api/manager/${qrToken}/reports`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({
      employeeId: row.employeeId,
      clockInLogId: row.clockInLogId,
      clockOutLogId: row.clockOutLogId,
      clockInAt: row.clockInAt.toISOString(),
      clockOutAt: row.clockOutAt.toISOString(),
      shiftState: row.shiftState,
    }),
  });

  return readJson<{ ok: true; clockOutLogId: string }>(response);
}
