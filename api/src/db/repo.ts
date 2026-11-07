import { asc, desc, eq } from "drizzle-orm";

import type { Db } from "./client.js";
import { employees, stores, timelogs } from "./schema.js";

export type Store = typeof stores.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Timelog = typeof timelogs.$inferSelect;

export function toPublicStore(store: Store) {
  return { id: store.id, name: store.name, qr_token: store.qr_token };
}

export function toOwnerStoreSummary(store: Store) {
  return { ...toPublicStore(store), created_at: store.created_at };
}

function sortEmployeesByStatusAndName(list: Employee[]) {
  return [...list].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "active" ? -1 : 1;
    }
    return left.name.localeCompare(right.name) || left.created_at.getTime() - right.created_at.getTime();
  });
}

export async function getStoreByQrToken(db: Db, qrToken: string): Promise<Store | null> {
  const [store] = await db.select().from(stores).where(eq(stores.qr_token, qrToken)).limit(1);
  return store ?? null;
}

export async function getStoreById(db: Db, storeId: string): Promise<Store | null> {
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  return store ?? null;
}

export async function getOwnerStoreSummaries(db: Db) {
  const rows = await db.select().from(stores).orderBy(desc(stores.created_at));
  return rows.map(toOwnerStoreSummary);
}

export async function getEmployeesByStoreId(db: Db, storeId: string) {
  return sortEmployeesByStatusAndName(await db.select().from(employees).where(eq(employees.store_id, storeId)));
}

export async function getOwnerStoreRoster(db: Db, storeId: string) {
  const store = await getStoreById(db, storeId);
  if (!store) {
    return null;
  }
  return { store: toOwnerStoreSummary(store), employees: await getEmployeesByStoreId(db, storeId) };
}

export async function getStoreTimelogs(db: Db, storeId: string) {
  return db.select().from(timelogs).where(eq(timelogs.store_id, storeId)).orderBy(asc(timelogs.timestamp));
}

export async function getScanRoster(db: Db, qrToken: string) {
  const store = await getStoreByQrToken(db, qrToken);
  if (!store) {
    return null;
  }

  const [storeEmployees, storeTimelogs] = await Promise.all([
    getEmployeesByStoreId(db, store.id),
    getStoreTimelogs(db, store.id),
  ]);
  const latestLogByEmployee = new Map<string, Timelog>();
  for (const timelog of storeTimelogs) {
    latestLogByEmployee.set(timelog.employee_id, timelog);
  }

  return {
    store: toPublicStore(store),
    employees: storeEmployees
      .filter((employee) => employee.status !== "archived")
      .map((employee) => {
        const latestLog = latestLogByEmployee.get(employee.id) ?? null;
        return { employee, latestLog, status: latestLog?.type === "IN" ? ("IN" as const) : ("OUT" as const) };
      }),
  };
}

export async function getReportsSnapshot(db: Db, qrToken: string) {
  const store = await getStoreByQrToken(db, qrToken);
  if (!store) {
    return null;
  }
  const [storeEmployees, storeTimelogs] = await Promise.all([
    getEmployeesByStoreId(db, store.id),
    getStoreTimelogs(db, store.id),
  ]);
  return { store: toPublicStore(store), employees: storeEmployees, timelogs: storeTimelogs };
}
