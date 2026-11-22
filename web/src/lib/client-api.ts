"use client";

import type { ScanLocation } from "@/lib/geolocation";
import {
  DashboardSnapshotDto,
  MeDto,
  OwnerStoreRosterDto,
  OwnerStoreListDto,
  ReportsSnapshotDto,
  ScanRosterDto,
  SerializedEmployee,
  SerializedOwnerStoreSummary,
  SerializedScanEmployeeStatus,
  SerializedTimelog,
  StoreLookupDto,
  StoreMember,
} from "@/lib/api-types";
import type { TimesheetRow } from "@/features/reports/types";
import { DashboardEmployeeStatus, Employee, OwnerStoreSummary, PublicStore, ScanEmployeeStatus, Timelog } from "@/types";

export class ApiError extends Error {
  constructor(
    readonly code: string,
    message: string,
  ) {
    super(message);
  }
}

async function readJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;
    if (response.status === 401 && payload?.error === "unauthenticated" && typeof window !== "undefined") {
      window.location.reload();
    }
    throw new ApiError(payload?.error ?? "request_failed", payload?.message ?? payload?.error ?? "Request failed");
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

export interface ClockTicket {
  storeId: string;
  exp: number;
  mac: string;
}

export async function getScanTicket(qrToken: string, w: string, sig: string): Promise<ClockTicket> {
  const response = await fetch(
    `/api/stores/${qrToken}/scan-ticket?w=${encodeURIComponent(w)}&sig=${encodeURIComponent(sig)}`,
    { credentials: "same-origin", cache: "no-store" },
  );
  return (await readJson<{ ticket: ClockTicket }>(response)).ticket;
}

export async function submitClockAction(
  qrToken: string,
  employeeId: string,
  requestedAction: "IN" | "OUT",
  ticket?: ClockTicket | null,
  location?: ScanLocation | null,
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
      ticket: ticket ?? undefined,
      location: location ?? undefined,
    }),
  });

  return readJson<{ action: "IN" | "OUT"; timestamp: string }>(response);
}

export async function getOwnerStores() {
  const response = await fetch("/api/admin/stores", {
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload = await readJson<OwnerStoreListDto>(response);
  return payload.stores.map(parseOwnerStoreSummary);
}

export async function logoutOwner() {
  const response = await fetch("/api/admin/session", {
    method: "DELETE",
    credentials: "same-origin",
  });

  return readJson<{ ok: true }>(response);
}

export async function createStore(storeName: string, employeeNames: string[]) {
  const response = await fetch("/api/admin/stores", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ storeName, employeeNames }),
  });

  return readJson<{ storeId: string; storeName: string; qrToken: string }>(response);
}

export async function createDemoStore() {
  const response = await fetch("/api/admin/demo-store", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
  });

  return readJson<{ storeId: string; storeName: string; qrToken: string }>(response);
}

export async function createSession(idToken: string) {
  const response = await fetch("/api/session", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ idToken }),
  });

  return readJson<{ ok: true; email: string }>(response);
}

export async function getMe(): Promise<MeDto | null> {
  const response = await fetch("/api/me", {
    credentials: "same-origin",
    cache: "no-store",
  });
  if (response.status === 401) {
    return null;
  }
  return readJson<MeDto>(response);
}

export async function logout() {
  const response = await fetch("/api/session", {
    method: "DELETE",
    credentials: "same-origin",
  });

  return readJson<{ ok: true }>(response);
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

export interface DisplayQr {
  store_name: string;
  qr_token: string;
  window: number;
  sig: string;
  refresh_in_ms: number;
}

export async function getDisplayQr(storeId: string, displayKey: string): Promise<DisplayQr> {
  const response = await fetch(`/api/display/${encodeURIComponent(storeId)}/qr`, {
    headers: { "x-display-key": displayKey },
    cache: "no-store",
    credentials: "same-origin",
  });
  return readJson<DisplayQr>(response);
}

export async function getStoreMembers(storeId: string) {
  const response = await fetch(`/api/admin/stores/${storeId}/members`, {
    credentials: "same-origin",
    cache: "no-store",
  });
  const payload = await readJson<{ members: StoreMember[] }>(response);
  return payload.members;
}

export async function addStoreManager(storeId: string, email: string) {
  const response = await fetch(`/api/admin/stores/${storeId}/members`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    credentials: "same-origin",
    body: JSON.stringify({ email }),
  });

  return readJson<{ member: StoreMember }>(response);
}

export async function removeStoreManager(storeId: string, email: string) {
  const response = await fetch(`/api/admin/stores/${storeId}/members/${encodeURIComponent(email)}`, {
    method: "DELETE",
    credentials: "same-origin",
  });

  return readJson<{ ok: true }>(response);
}

export interface QrSettings {
  qr_mode: "display" | "printed";
  has_location: boolean;
  lat: number | null;
  lng: number | null;
  radius_m: number;
  display_key?: string | null;
}

async function qrCall<T>(storeId: string, path: string, method: "GET" | "PUT" | "POST", body: object = {}) {
  const response = await fetch(`/api/admin/stores/${encodeURIComponent(storeId)}/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    cache: "no-store",
    body: method === "GET" ? undefined : JSON.stringify(body),
  });
  return readJson<T>(response);
}

export const getQrSettings = (storeId: string) => qrCall<QrSettings>(storeId, "qr-settings", "GET");
export const setQrMode = (storeId: string, qr_mode: QrSettings["qr_mode"]) =>
  qrCall<QrSettings>(storeId, "qr-mode", "PUT", { qr_mode });
export const setStoreLocation = (storeId: string, lat: number, lng: number, radius_m?: number) =>
  qrCall<QrSettings>(storeId, "location", "PUT", { lat, lng, radius_m });
export const reissueQr = async (storeId: string) => {
  await qrCall<{ ok: true }>(storeId, "qr/reissue", "POST");
};
export const resetDisplayKey = (storeId: string) => qrCall<QrSettings>(storeId, "display-key/reset", "POST");
