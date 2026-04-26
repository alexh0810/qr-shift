export interface Store {
  id: string; // Firestore Document ID
  name: string;
  qr_token: string;
  created_at: Date;
  pin?: string; // Legacy plaintext PIN kept only for migration tooling
  pin_hash?: string;
}

export interface PublicStore {
  id: string;
  name: string;
  qr_token: string;
}

export interface OwnerStoreSummary {
  id: string;
  name: string;
  qr_token: string;
  created_at: Date;
}

export interface Employee {
  id: string; // Firestore Document ID
  name: string;
  store_id: string;
  created_at: Date;
}

export interface Timelog {
  id: string; // Firestore Document ID
  employee_id: string;
  store_id: string;
  type: "IN" | "OUT";
  timestamp: Date;
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
