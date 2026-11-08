import { asc } from "drizzle-orm";

import type { Db } from "../db/client.js";
import type { Employee, Store, Timelog } from "../db/repo.js";
import { employees, stores, timelogs } from "../db/schema.js";

export type FirestoreDoc = { id: string; data: Record<string, unknown> };
export type FirestoreSnapshot = { stores: FirestoreDoc[]; employees: FirestoreDoc[]; timelogs: FirestoreDoc[] };
export type ImportRows = { stores: Store[]; employees: Employee[]; timelogs: Timelog[] };

const CHUNK_SIZE = 500;

function toDate(value: unknown, where: string): Date {
  const date =
    value instanceof Date
      ? value
      : value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function"
        ? (value.toDate() as Date)
        : null;
  if (!date || Number.isNaN(date.getTime())) {
    throw new Error(`${where}: missing or invalid timestamp`);
  }
  return date;
}

function requireString(value: unknown, where: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${where}: missing value`);
  }
  return value;
}

export function toRows(snapshot: FirestoreSnapshot): ImportRows {
  const storeRows = snapshot.stores.map(({ id, data }): Store => {
    const where = `stores/${id}`;
    if (typeof data.pin_hash !== "string" && typeof data.pin === "string") {
      throw new Error(`${where}: plaintext PIN only; run npm run migrate:pins -w @qrshift/web first`);
    }
    return {
      id,
      name: requireString(data.name, `${where}.name`),
      qr_token: requireString(data.qr_token, `${where}.qr_token`),
      pin_hash: typeof data.pin_hash === "string" ? data.pin_hash : null,
      created_at: toDate(data.created_at, `${where}.created_at`),
    };
  });
  const storeIds = new Set(storeRows.map((store) => store.id));

  const employeeRows = snapshot.employees.map(({ id, data }): Employee => {
    const where = `employees/${id}`;
    const storeId = requireString(data.store_id, `${where}.store_id`);
    if (!storeIds.has(storeId)) {
      throw new Error(`${where}: references missing store ${storeId}`);
    }
    return {
      id,
      store_id: storeId,
      name: requireString(data.name, `${where}.name`),
      status: data.status === "archived" ? "archived" : "active",
      created_at: toDate(data.created_at, `${where}.created_at`),
    };
  });
  const employeeIds = new Set(employeeRows.map((employee) => employee.id));

  const timelogRows = snapshot.timelogs.map(({ id, data }): Timelog => {
    const where = `timelogs/${id}`;
    if (data.type !== "IN" && data.type !== "OUT") {
      throw new Error(`${where}: invalid type ${String(data.type)}`);
    }
    const employeeId = requireString(data.employee_id, `${where}.employee_id`);
    const storeId = requireString(data.store_id, `${where}.store_id`);
    if (!employeeIds.has(employeeId)) {
      throw new Error(`${where}: references missing employee ${employeeId}`);
    }
    if (!storeIds.has(storeId)) {
      throw new Error(`${where}: references missing store ${storeId}`);
    }
    return { id, employee_id: employeeId, store_id: storeId, type: data.type, timestamp: toDate(data.timestamp, `${where}.timestamp`) };
  });

  return { stores: storeRows, employees: employeeRows, timelogs: timelogRows };
}

export async function replaceAll(db: Db, rows: ImportRows) {
  await db.transaction(async (tx) => {
    await tx.delete(timelogs);
    await tx.delete(employees);
    await tx.delete(stores);
    for (let i = 0; i < rows.stores.length; i += CHUNK_SIZE) {
      await tx.insert(stores).values(rows.stores.slice(i, i + CHUNK_SIZE));
    }
    for (let i = 0; i < rows.employees.length; i += CHUNK_SIZE) {
      await tx.insert(employees).values(rows.employees.slice(i, i + CHUNK_SIZE));
    }
    for (let i = 0; i < rows.timelogs.length; i += CHUNK_SIZE) {
      await tx.insert(timelogs).values(rows.timelogs.slice(i, i + CHUNK_SIZE));
    }
  });
}

export async function readAll(db: Db): Promise<ImportRows> {
  const [storeRows, employeeRows, timelogRows] = await Promise.all([
    db.select().from(stores).orderBy(asc(stores.id)),
    db.select().from(employees).orderBy(asc(employees.id)),
    db.select().from(timelogs).orderBy(asc(timelogs.id)),
  ]);
  return { stores: storeRows, employees: employeeRows, timelogs: timelogRows };
}

export function diffRows(expected: ImportRows, actual: ImportRows): string[] {
  const differences: string[] = [];
  for (const table of ["stores", "employees", "timelogs"] as const) {
    const actualById = new Map<string, string>(actual[table].map((row) => [row.id, JSON.stringify(row)]));
    for (const row of expected[table]) {
      const found = actualById.get(row.id);
      if (found === undefined) {
        differences.push(`${table}/${row.id}: missing in Postgres`);
      } else if (found !== JSON.stringify(row)) {
        differences.push(`${table}/${row.id}: differs`);
      }
      actualById.delete(row.id);
    }
    for (const id of actualById.keys()) {
      differences.push(`${table}/${id}: extra in Postgres`);
    }
  }
  return differences;
}
