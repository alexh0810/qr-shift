export interface Store {
  id: string;
  name: string;
  qr_token: string;
  created_at: Date;
}

export interface PublicStore {
  id: string;
  name: string;
  qr_token: string;
  qr_mode?: "display" | "printed";
}

export interface OwnerStoreSummary {
  id: string;
  name: string;
  qr_token: string;
  created_at: Date;
}

export interface Employee {
  id: string;
  name: string;
  store_id: string;
  created_at: Date;
  status: "active" | "archived";
}

export type LocationStatus = "inside" | "outside" | "unknown";

export interface Timelog {
  id: string;
  employee_id: string;
  store_id: string;
  type: "IN" | "OUT";
  timestamp: Date;
  location_status?: LocationStatus | null;
}

export interface Correction {
  id: string;
  timelog_id: string;
  old_timestamp: Date | null;
  new_timestamp: Date;
  changed_by: string;
  reason: string;
  created_at: Date;
}

export interface ScanEmployeeStatus {
  employee: Employee;
  latestLog: Timelog | null;
  status: "IN" | "OUT";
}

export interface DashboardEmployeeStatus {
  employee: Employee;
  latestLog: Timelog | null;
  status: "IN" | "OUT";
}
