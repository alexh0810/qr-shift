import { hashPin } from "./auth.js";
import type { Db } from "./db/client.js";
import { employees, stores, timelogs } from "./db/schema.js";
import { createTestDb } from "./db/test-db.js";

process.env.MANAGER_SESSION_SECRET ??= "test-manager-secret";
process.env.OWNER_SETUP_SECRET ??= "test-owner-secret";

export const at = (value: string) => new Date(value);

export async function seededDb(): Promise<Db> {
  const db = await createTestDb();
  await db.insert(stores).values([
    { id: "store-1", name: "Downtown", qr_token: "qr-1", pin_hash: await hashPin("1234"), created_at: at("2026-04-01T00:00:00Z") },
    { id: "store-2", name: "Midtown", qr_token: "qr-2", pin_hash: null, created_at: at("2026-04-10T00:00:00Z") },
  ]);
  await db.insert(employees).values([
    { id: "emp-1", store_id: "store-1", name: "Alex", status: "active", created_at: at("2026-04-01T00:00:00Z") },
    { id: "emp-2", store_id: "store-1", name: "Kim", status: "active", created_at: at("2026-04-01T00:00:00Z") },
    { id: "emp-3", store_id: "store-1", name: "Bea", status: "archived", created_at: at("2026-04-01T00:00:00Z") },
    { id: "emp-9", store_id: "store-2", name: "Sam", status: "active", created_at: at("2026-04-10T00:00:00Z") },
  ]);
  await db.insert(timelogs).values([
    { id: "log-1", employee_id: "emp-1", store_id: "store-1", type: "IN", timestamp: at("2026-04-20T08:00:00Z") },
    { id: "log-2", employee_id: "emp-1", store_id: "store-1", type: "OUT", timestamp: at("2026-04-20T16:00:00Z") },
    { id: "log-3", employee_id: "emp-2", store_id: "store-1", type: "IN", timestamp: at("2026-04-21T08:00:00Z") },
  ]);
  return db;
}
