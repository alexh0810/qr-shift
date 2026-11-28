import { and, asc, desc, eq } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { nanoid } from "nanoid";

import { buildDemoStoreSeed } from "../demo-data.js";
import type { LocationStatus } from "../location.js";
import type { Db } from "./client.js";
import { corrections, employees, storeMembers, stores, timelogs } from "./schema.js";

export type Store = typeof stores.$inferSelect;
export type Employee = typeof employees.$inferSelect;
export type Timelog = typeof timelogs.$inferSelect;

export function toPublicStore(store: Store) {
  return { id: store.id, name: store.name, qr_token: store.qr_token, qr_mode: store.qr_mode };
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

export function toQrSettings(store: Store) {
  return {
    qr_mode: store.qr_mode,
    has_location: store.lat !== null && store.lng !== null,
    lat: store.lat,
    lng: store.lng,
    radius_m: store.radius_m,
    display_key: store.qr_mode === "display" ? store.display_key : null,
  };
}

export async function updateStoreQr(
  db: Db,
  storeId: string,
  patch: Partial<{ [K in "qr_mode" | "qr_secret" | "display_key" | "lat" | "lng" | "radius_m"]: Store[K] | SQL }>,
) {
  const [row] = await db.update(stores).set(patch).where(eq(stores.id, storeId)).returning();
  return row;
}

export async function getStoreById(db: Db, storeId: string): Promise<Store | null> {
  const [store] = await db.select().from(stores).where(eq(stores.id, storeId)).limit(1);
  return store ?? null;
}

export async function getOwnerStoreSummaries(db: Db, email: string) {
  const rows = await db
    .select({ store: stores })
    .from(storeMembers)
    .innerJoin(stores, eq(stores.id, storeMembers.store_id))
    .where(and(eq(storeMembers.email, normalizeEmail(email)), eq(storeMembers.role, "owner")))
    .orderBy(desc(stores.created_at), asc(stores.id));
  return rows.map((row) => toOwnerStoreSummary(row.store));
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

export async function createClockAction(
  db: Db,
  qrToken: string,
  employeeId: string,
  requestedAction: "IN" | "OUT",
  extra: { at?: Date; locationStatus?: LocationStatus | null } = {},
) {
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

    const timestamp = extra.at ?? new Date();
    await tx.insert(timelogs).values({
      id: nanoid(),
      employee_id: employeeId,
      store_id: store.id,
      type: requestedAction,
      timestamp,
      location_status: extra.locationStatus ?? null,
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
    reason: string;
    changedBy: string;
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
    const [employee] = await tx.select().from(employees).where(eq(employees.id, input.employeeId)).for("update");
    if (!employee) {
      throw new Error("employee_not_found");
    }
    if (employee.store_id !== store.id) {
      throw new Error("employee_store_mismatch");
    }

    // Audit rows share the transaction with the timelog updates, so a correction cannot exist without its history.
    const changes: { timelog_id: string; old_timestamp: Date | null; new_timestamp: Date }[] = [];
    const moveTimelog = async (log: Timelog, to: Date) => {
      if (log.timestamp.getTime() === to.getTime()) {
        return;
      }
      await tx.update(timelogs).set({ timestamp: to }).where(eq(timelogs.id, log.id));
      changes.push({ timelog_id: log.id, old_timestamp: log.timestamp, new_timestamp: to });
    };

    const [clockIn] = await tx.select().from(timelogs).where(eq(timelogs.id, input.clockInLogId)).for("update");
    if (!clockIn) {
      throw new Error("clock_in_not_found");
    }
    if (clockIn.employee_id !== input.employeeId || clockIn.store_id !== store.id || clockIn.type !== "IN") {
      throw new Error("invalid_clock_in");
    }
    await moveTimelog(clockIn, input.clockInAt);

    let clockOutLogId: string;
    if (input.clockOutLogId) {
      const [clockOut] = await tx.select().from(timelogs).where(eq(timelogs.id, input.clockOutLogId)).for("update");
      if (!clockOut) {
        throw new Error("clock_out_not_found");
      }
      if (clockOut.employee_id !== input.employeeId || clockOut.store_id !== store.id || clockOut.type !== "OUT") {
        throw new Error("invalid_clock_out");
      }
      await moveTimelog(clockOut, input.clockOutAt);
      clockOutLogId = clockOut.id;
    } else {
      clockOutLogId = nanoid();
      await tx.insert(timelogs).values({
        id: clockOutLogId,
        employee_id: input.employeeId,
        store_id: store.id,
        type: "OUT",
        timestamp: input.clockOutAt,
      });
      changes.push({ timelog_id: clockOutLogId, old_timestamp: null, new_timestamp: input.clockOutAt });
    }

    if (changes.length > 0) {
      await tx.insert(corrections).values(
        changes.map((change) => ({ id: nanoid(), ...change, changed_by: input.changedBy, reason: input.reason })),
      );
    }
    return { ok: true as const, clockOutLogId };
  });
}

export async function createStoreAndEmployees(db: Db, storeName: string, ownerEmail: string, employeeNames: string[]) {
  const storeId = nanoid();
  const qrToken = nanoid(16);
  const createdAt = new Date();
  const names = employeeNames.map((name) => name.trim()).filter(Boolean);

  await db.transaction(async (tx) => {
    await tx.insert(stores).values({ id: storeId, name: storeName.trim(), qr_token: qrToken, created_at: createdAt });
    await tx.insert(storeMembers).values({ store_id: storeId, email: normalizeEmail(ownerEmail), role: "owner" });
    if (names.length > 0) {
      await tx.insert(employees).values(
        names.map((name) => ({ id: nanoid(), store_id: storeId, name, status: "active" as const, created_at: createdAt })),
      );
    }
  });

  return { storeId, storeName: storeName.trim(), qrToken };
}

export async function createDemoStoreWithTimelogs(db: Db, ownerEmail: string) {
  const seed = buildDemoStoreSeed();
  const storeId = nanoid();
  const qrToken = nanoid(16);
  const createdAt = new Date();
  const employeeIdByName = new Map(seed.employeeNames.map((name) => [name, nanoid()]));

  await db.transaction(async (tx) => {
    await tx.insert(stores).values({ id: storeId, name: seed.storeName, qr_token: qrToken, created_at: createdAt });
    await tx.insert(storeMembers).values({ store_id: storeId, email: normalizeEmail(ownerEmail), role: "owner" });
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

  return { storeId, storeName: seed.storeName, qrToken };
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

export type MemberRole = "owner" | "manager";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function getMemberRole(db: Db, storeId: string, email: string): Promise<MemberRole | null> {
  const [row] = await db
    .select({ role: storeMembers.role })
    .from(storeMembers)
    .where(and(eq(storeMembers.store_id, storeId), eq(storeMembers.email, normalizeEmail(email))))
    .limit(1);
  return row?.role ?? null;
}

export async function getMemberships(db: Db, email: string) {
  return db
    .select({
      id: stores.id,
      name: stores.name,
      qr_token: stores.qr_token,
      created_at: stores.created_at,
      role: storeMembers.role,
    })
    .from(storeMembers)
    .innerJoin(stores, eq(stores.id, storeMembers.store_id))
    .where(eq(storeMembers.email, normalizeEmail(email)))
    .orderBy(desc(stores.created_at), asc(stores.id));
}

export async function assignOwnerToAllStores(db: Db, email: string) {
  const rows = await db.select({ id: stores.id }).from(stores);
  if (rows.length === 0) {
    return 0;
  }
  await db
    .insert(storeMembers)
    .values(rows.map((row) => ({ store_id: row.id, email: normalizeEmail(email), role: "owner" as const })))
    .onConflictDoUpdate({ target: [storeMembers.store_id, storeMembers.email], set: { role: "owner" } });
  return rows.length;
}

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function listMembers(db: Db, storeId: string) {
  return db
    .select({ email: storeMembers.email, role: storeMembers.role })
    .from(storeMembers)
    .where(eq(storeMembers.store_id, storeId))
    .orderBy(asc(storeMembers.role), asc(storeMembers.email));
}

export async function addManager(db: Db, storeId: string, email: string) {
  const normalized = normalizeEmail(email);
  if (!EMAIL_PATTERN.test(normalized)) {
    throw new Error("invalid_email");
  }
  const inserted = await db
    .insert(storeMembers)
    .values({ store_id: storeId, email: normalized, role: "manager" })
    .onConflictDoNothing()
    .returning();
  if (inserted.length === 0) {
    throw new Error("already_member");
  }
  return { email: normalized, role: "manager" as const };
}

export async function removeManager(db: Db, storeId: string, email: string) {
  const normalized = normalizeEmail(email);
  const role = await getMemberRole(db, storeId, normalized);
  if (!role) {
    throw new Error("member_not_found");
  }
  if (role === "owner") {
    throw new Error("cannot_remove_owner");
  }
  await db.delete(storeMembers).where(and(eq(storeMembers.store_id, storeId), eq(storeMembers.email, normalized)));
}
