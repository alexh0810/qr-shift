export interface Store {
  id: string; // Firestore Document ID
  name: string;
  qr_token: string;
  pin: string; // Manager PIN
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
