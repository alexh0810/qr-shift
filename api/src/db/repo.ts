import { asc, desc, eq } from "drizzle-orm";
import { nanoid } from "nanoid";

import { hashPin } from "../auth.js";
import { buildDemoStoreSeed } from "../demo-data.js";
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
  const rows = await db.select().from(stores).orderBy(desc(stores.created_at), asc(stores.id));
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
  return db.select().from(timelogs).where(eq(timelogs.store_id, storeId)).orderBy(asc(timelogs.timestamp), asc(timelogs.id));
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

function normalizeEmployeeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

async function assertUniqueEmployeeName(db: Db, storeId: string, name: string, excludeEmployeeId?: string) {
  const normalized = normalizeEmployeeName(name);
  const duplicate = (await getEmployeesByStoreId(db, storeId)).some(
    (employee) => employee.id !== excludeEmployeeId && normalizeEmployeeName(employee.name) === normalized,
  );
  if (duplicate) {
    throw new Error("duplicate_employee_name");
  }
}

export async function createClockAction(db: Db, qrToken: string, employeeId: string, requestedAction: "IN" | "OUT") {
  const store = await getStoreByQrToken(db, qrToken);
  if (!store) {
    throw new Error("store_not_found");
  }

  return db.transaction(async (tx) => {
    // Locking the employee row serializes concurrent scans, so two quick taps cannot both pass the transition check.
    const [employee] = await tx.select().from(employees).where(eq(employees.id, employeeId)).for("update");
    if (!employee) {
      throw new Error("employee_not_found");
    }
    if (employee.store_id !== store.id) {
      throw new Error("employee_store_mismatch");
    }

    const [latestLog] = await tx
      .select()
      .from(timelogs)
      .where(eq(timelogs.employee_id, employeeId))
      .orderBy(desc(timelogs.timestamp), desc(timelogs.id))
      .limit(1);
    const expectedAction = latestLog?.type === "IN" ? "OUT" : "IN";
    if (requestedAction !== expectedAction) {
      throw new Error("invalid_transition");
    }

    const timestamp = new Date();
    await tx.insert(timelogs).values({
      id: nanoid(),
      employee_id: employeeId,
      store_id: store.id,
      type: requestedAction,
      timestamp,
    });
    return { employee, action: requestedAction, timestamp };
  });
}

export async function saveReportCorrection(
  db: Db,
  input: {
    qrToken: string;
    employeeId: string;
    clockInLogId: string;
    clockOutLogId: string | null;
    clockInAt: Date;
    clockOutAt: Date;
  },
) {
  const store = await getStoreByQrToken(db, input.qrToken);
  if (!store) {
    throw new Error("store_not_found");
  }
  if (input.clockOutAt <= input.clockInAt) {
    throw new Error("invalid_range");
  }
  if (input.clockOutAt > new Date()) {
    throw new Error("future_correction_not_supported");
  }

  return db.transaction(async (tx) => {
    const [employee] = await tx.select().from(employees).where(eq(employees.id, input.employeeId));
    if (!employee) {
      throw new Error("employee_not_found");
    }
    if (employee.store_id !== store.id) {
      throw new Error("employee_store_mismatch");
    }

    const [clockIn] = await tx.select().from(timelogs).where(eq(timelogs.id, input.clockInLogId)).for("update");
    if (!clockIn) {
      throw new Error("clock_in_not_found");
    }
    if (clockIn.employee_id !== input.employeeId || clockIn.store_id !== store.id || clockIn.type !== "IN") {
      throw new Error("invalid_clock_in");
    }
    await tx.update(timelogs).set({ timestamp: input.clockInAt }).where(eq(timelogs.id, clockIn.id));

    if (input.clockOutLogId) {
      const [clockOut] = await tx.select().from(timelogs).where(eq(timelogs.id, input.clockOutLogId)).for("update");
      if (!clockOut) {
        throw new Error("clock_out_not_found");
      }
      if (clockOut.employee_id !== input.employeeId || clockOut.store_id !== store.id || clockOut.type !== "OUT") {
        throw new Error("invalid_clock_out");
      }
      await tx.update(timelogs).set({ timestamp: input.clockOutAt }).where(eq(timelogs.id, clockOut.id));
      return { ok: true as const, clockOutLogId: clockOut.id };
    }

    const clockOutLogId = nanoid();
    await tx.insert(timelogs).values({
      id: clockOutLogId,
      employee_id: input.employeeId,
      store_id: store.id,
      type: "OUT",
      timestamp: input.clockOutAt,
    });
    return { ok: true as const, clockOutLogId };
  });
}

export async function createStoreAndEmployees(db: Db, storeName: string, pin: string, employeeNames: string[]) {
  const storeId = nanoid();
  const qrToken = nanoid(16);
  const createdAt = new Date();
  const names = employeeNames.map((name) => name.trim()).filter(Boolean);
  const pinHash = await hashPin(pin.trim());

  await db.transaction(async (tx) => {
    await tx.insert(stores).values({ id: storeId, name: storeName.trim(), qr_token: qrToken, pin_hash: pinHash, created_at: createdAt });
    if (names.length > 0) {
      await tx.insert(employees).values(
        names.map((name) => ({ id: nanoid(), store_id: storeId, name, status: "active" as const, created_at: createdAt })),
      );
    }
  });

  return { storeId, storeName: storeName.trim(), qrToken };
}

export async function createDemoStoreWithTimelogs(db: Db) {
  const seed = buildDemoStoreSeed();
  const storeId = nanoid();
  const qrToken = nanoid(16);
  const createdAt = new Date();
  const employeeIdByName = new Map(seed.employeeNames.map((name) => [name, nanoid()]));
  const pinHash = await hashPin(seed.pin);

  await db.transaction(async (tx) => {
    await tx.insert(stores).values({ id: storeId, name: seed.storeName, qr_token: qrToken, pin_hash: pinHash, created_at: createdAt });
    await tx.insert(employees).values(
      seed.employeeNames.map((name) => ({
        id: employeeIdByName.get(name)!,
        store_id: storeId,
        name,
        status: "active" as const,
        created_at: createdAt,
      })),
    );
    await tx.insert(timelogs).values(
      seed.timelogs.map((log) => ({
        id: nanoid(),
        employee_id: employeeIdByName.get(log.employeeName)!,
        store_id: storeId,
        type: log.type,
        timestamp: log.timestamp,
      })),
    );
  });

  return { storeId, storeName: seed.storeName, qrToken, pin: seed.pin };
}

export async function createEmployeeForStore(db: Db, storeId: string, name: string) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("invalid_employee_name");
  }
  if (!(await getStoreById(db, storeId))) {
    throw new Error("store_not_found");
  }
  await assertUniqueEmployeeName(db, storeId, trimmedName);

  const [employee] = await db
    .insert(employees)
    .values({ id: nanoid(), store_id: storeId, name: trimmedName, status: "active", created_at: new Date() })
    .returning();
  return employee;
}

export async function updateEmployeeForStore(
  db: Db,
  input: { storeId: string; employeeId: string; name?: string; status?: "active" | "archived" },
) {
  if (!(await getStoreById(db, input.storeId))) {
    throw new Error("store_not_found");
  }

  const [employee] = await db.select().from(employees).where(eq(employees.id, input.employeeId));
  if (!employee) {
    throw new Error("employee_not_found");
  }
  if (employee.store_id !== input.storeId) {
    throw new Error("employee_store_mismatch");
  }

  const patch: { name?: string; status?: "active" | "archived" } = {};
  if (typeof input.name === "string") {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error("invalid_employee_name");
    }
    await assertUniqueEmployeeName(db, input.storeId, trimmedName, input.employeeId);
    patch.name = trimmedName;
  }
  if (input.status === "active" || input.status === "archived") {
    patch.status = input.status;
  }
  if (Object.keys(patch).length === 0) {
    throw new Error("no_employee_changes");
  }

  const [updated] = await db.update(employees).set(patch).where(eq(employees.id, input.employeeId)).returning();
  return updated;
}
