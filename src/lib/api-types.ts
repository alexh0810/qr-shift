import { Employee, PublicStore, Timelog } from "@/types";

export interface SerializedEmployee extends Omit<Employee, "created_at"> {
  created_at: string;
}

export interface SerializedTimelog extends Omit<Timelog, "timestamp"> {
  timestamp: string;
}

export type PublicStoreDto = PublicStore;

export interface SerializedScanEmployeeStatus {
  employee: SerializedEmployee;
  latest_log: SerializedTimelog | null;
  status: "IN" | "OUT";
}

export interface DashboardSnapshotDto {
  store: PublicStoreDto;
  employees: SerializedScanEmployeeStatus[];
}

export interface ReportsSnapshotDto {
  store: PublicStoreDto;
  employees: SerializedEmployee[];
  timelogs: SerializedTimelog[];
}

export interface StoreLookupDto {
  store: PublicStoreDto;
}

export interface ScanRosterDto {
  store: PublicStoreDto;
  employees: SerializedScanEmployeeStatus[];
}
