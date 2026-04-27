import type { Firestore } from "firebase-admin/firestore";

import { adminDb } from "./firebase-admin";
import { buildDemoStoreSeed } from "./demoData";
import { hashPin } from "./pin-hash";
import { DashboardEmployeeStatus, Employee, OwnerStoreSummary, PublicStore, Store, Timelog } from "../types";

type DbLike = Pick<Firestore, "collection" | "runTransaction">;
type EmployeeStatus = Employee["status"];

function ensureDate(value: unknown) {
  if (value instanceof Date) {
    return value;
  }

  if (value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate() as Date;
  }

  return new Date();
}

async function generateToken(size: number) {
  const { nanoid } = await import("nanoid");
  return nanoid(size);
}

function normalizeEmployeeName(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, " ");
}

function sortEmployeesByStatusAndName(employees: Employee[]) {
  return [...employees].sort((left, right) => {
    if (left.status !== right.status) {
      return left.status === "active" ? -1 : 1;
    }

    const byName = left.name.localeCompare(right.name);
    if (byName !== 0) {
      return byName;
    }

    return left.created_at.getTime() - right.created_at.getTime();
  });
}

function mapStore(id: string, data: Record<string, unknown>): Store {
  return {
    id,
    name: String(data.name ?? ""),
    qr_token: String(data.qr_token ?? ""),
    created_at: ensureDate(data.created_at),
    pin: typeof data.pin === "string" ? data.pin : undefined,
    pin_hash: typeof data.pin_hash === "string" ? data.pin_hash : undefined,
  };
}

function mapEmployee(id: string, data: Record<string, unknown>): Employee {
  return {
    id,
    name: String(data.name ?? ""),
    store_id: String(data.store_id ?? ""),
    created_at: ensureDate(data.created_at),
    status: data.status === "archived" ? "archived" : "active",
  };
}

function mapTimelog(id: string, data: Record<string, unknown>): Timelog {
  return {
    id,
    employee_id: String(data.employee_id ?? ""),
    store_id: String(data.store_id ?? ""),
    type: data.type === "OUT" ? "OUT" : "IN",
    timestamp: ensureDate(data.timestamp),
  };
}

export function toPublicStore(store: Store): PublicStore {
  return {
    id: store.id,
    name: store.name,
    qr_token: store.qr_token,
  };
}

export function toOwnerStoreSummary(store: Store): OwnerStoreSummary {
  return {
    id: store.id,
    name: store.name,
    qr_token: store.qr_token,
    created_at: store.created_at,
  };
}

export async function getStoreByQrTokenWithDb(db: DbLike, qrToken: string) {
  const snapshot = await db
    .collection("stores")
    .where("qr_token", "==", qrToken)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return null;
  }

  const document = snapshot.docs[0];
  return mapStore(document.id, document.data());
}

export async function getStoreByQrTokenServer(qrToken: string) {
  return getStoreByQrTokenWithDb(adminDb, qrToken);
}

export async function getOwnerStoreSummariesWithDb(db: DbLike) {
  const snapshot = await db.collection("stores").get();
  return snapshot.docs
    .map((document) => toOwnerStoreSummary(mapStore(document.id, document.data())))
    .sort((left, right) => right.created_at.getTime() - left.created_at.getTime());
}

export async function getOwnerStoreSummariesServer() {
  return getOwnerStoreSummariesWithDb(adminDb);
}

export async function getEmployeesByStoreIdWithDb(db: DbLike, storeId: string) {
  const snapshot = await db.collection("employees").where("store_id", "==", storeId).get();
  return sortEmployeesByStatusAndName(
    snapshot.docs.map((document) => mapEmployee(document.id, document.data())),
  );
}

export async function getEmployeesByStoreIdServer(storeId: string) {
  return getEmployeesByStoreIdWithDb(adminDb, storeId);
}

export async function getOwnerStoreRosterWithDb(db: DbLike, storeId: string) {
  const snapshot = await db.collection("stores").get();
  const storeDocument = snapshot.docs.find((document) => document.id === storeId);

  if (!storeDocument) {
    return null;
  }

  return {
    store: toOwnerStoreSummary(mapStore(storeDocument.id, storeDocument.data())),
    employees: await getEmployeesByStoreIdWithDb(db, storeId),
  };
}

export async function getOwnerStoreRosterServer(storeId: string) {
  return getOwnerStoreRosterWithDb(adminDb, storeId);
}

export async function getStoreTimelogsWithDb(db: DbLike, storeId: string) {
  const snapshot = await db.collection("timelogs").where("store_id", "==", storeId).get();
  return snapshot.docs
    .map((document) => mapTimelog(document.id, document.data()))
    .sort((left, right) => left.timestamp.getTime() - right.timestamp.getTime());
}

export async function getStoreTimelogsServer(storeId: string) {
  return getStoreTimelogsWithDb(adminDb, storeId);
}

export async function getLatestTimelogForEmployeeWithDb(db: DbLike, employeeId: string) {
  const snapshot = await db
    .collection("timelogs")
    .where("employee_id", "==", employeeId)
    .get();

  if (snapshot.empty) {
    return null;
  }

  return snapshot.docs
    .map((document) => mapTimelog(document.id, document.data()))
    .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime())[0] ?? null;
}

export async function getLatestTimelogForEmployeeServer(employeeId: string) {
  return getLatestTimelogForEmployeeWithDb(adminDb, employeeId);
}

export async function getScanRosterByQrTokenWithDb(db: DbLike, qrToken: string) {
  const store = await getStoreByQrTokenWithDb(db, qrToken);
  if (!store) {
    return null;
  }

  const [employees, timelogs] = await Promise.all([
    getEmployeesByStoreIdWithDb(db, store.id),
    getStoreTimelogsWithDb(db, store.id),
  ]);
  const activeEmployees = employees.filter((employee) => employee.status !== "archived");

  const latestLogByEmployee = new Map<string, Timelog>();
  for (const timelog of timelogs) {
    latestLogByEmployee.set(timelog.employee_id, timelog);
  }

  return {
    store: toPublicStore(store),
    employees: activeEmployees.map((employee) => {
      const latestLog = latestLogByEmployee.get(employee.id) ?? null;
      return {
        employee,
        latestLog,
        status: latestLog?.type === "IN" ? "IN" : "OUT",
      };
    }),
  };
}

export async function getScanRosterByQrToken(qrToken: string) {
  return getScanRosterByQrTokenWithDb(adminDb, qrToken);
}

export async function getDashboardSnapshotByQrTokenWithDb(db: DbLike, qrToken: string) {
  const roster = await getScanRosterByQrTokenWithDb(db, qrToken);
  if (!roster) {
    return null;
  }

  return {
    store: roster.store,
    employees: roster.employees as DashboardEmployeeStatus[],
  };
}

export async function getDashboardSnapshotByQrToken(qrToken: string) {
  return getDashboardSnapshotByQrTokenWithDb(adminDb, qrToken);
}

export async function getReportsSnapshotByQrTokenWithDb(db: DbLike, qrToken: string) {
  const store = await getStoreByQrTokenWithDb(db, qrToken);
  if (!store) {
    return null;
  }

  const [employees, timelogs] = await Promise.all([
    getEmployeesByStoreIdWithDb(db, store.id),
    getStoreTimelogsWithDb(db, store.id),
  ]);

  return {
    store: toPublicStore(store),
    employees,
    timelogs,
  };
}

export async function getReportsSnapshotByQrToken(qrToken: string) {
  return getReportsSnapshotByQrTokenWithDb(adminDb, qrToken);
}

export async function createClockActionWithDb(
  db: DbLike,
  qrToken: string,
  employeeId: string,
  requestedAction: "IN" | "OUT",
) {
  const store = await getStoreByQrTokenWithDb(db, qrToken);
  if (!store) {
    throw new Error("store_not_found");
  }

  const employeeRef = db.collection("employees").doc(employeeId);
  const timelogsRef = db.collection("timelogs");
  const clockedAt = new Date();

  const result = await db.runTransaction(async (transaction) => {
    const employeeSnapshot = await transaction.get(employeeRef);
    if (!employeeSnapshot.exists) {
      throw new Error("employee_not_found");
    }

    const employee = mapEmployee(employeeSnapshot.id, employeeSnapshot.data() ?? {});
    if (employee.store_id !== store.id) {
      throw new Error("employee_store_mismatch");
    }

    const latestSnapshot = await transaction.get(timelogsRef.where("employee_id", "==", employeeId));
    const latestLog =
      latestSnapshot.docs
        .map((document) => mapTimelog(document.id, document.data()))
        .sort((left, right) => right.timestamp.getTime() - left.timestamp.getTime())[0] ?? null;
    const expectedAction = latestLog?.type === "IN" ? "OUT" : "IN";

    if (requestedAction !== expectedAction) {
      throw new Error("invalid_transition");
    }

    const newTimelogRef = timelogsRef.doc();
    transaction.create(newTimelogRef, {
      employee_id: employeeId,
      store_id: store.id,
      type: requestedAction,
      timestamp: clockedAt,
    });

    return {
      employee,
      action: requestedAction,
      timestamp: clockedAt,
    };
  });

  return result;
}

export async function createClockAction(qrToken: string, employeeId: string, requestedAction: "IN" | "OUT") {
  return createClockActionWithDb(adminDb, qrToken, employeeId, requestedAction);
}

export async function saveReportCorrectionServerWithDb(
  db: DbLike,
  input: {
  qrToken: string;
  employeeId: string;
  clockInLogId: string;
  clockOutLogId: string | null;
  clockInAt: Date;
  clockOutAt: Date;
},
) {
  const store = await getStoreByQrTokenWithDb(db, input.qrToken);
  if (!store) {
    throw new Error("store_not_found");
  }

  const employeeRef = db.collection("employees").doc(input.employeeId);
  const clockInRef = db.collection("timelogs").doc(input.clockInLogId);
  const clockOutRef = input.clockOutLogId
    ? db.collection("timelogs").doc(input.clockOutLogId)
    : db.collection("timelogs").doc();

  const now = new Date();
  if (input.clockOutAt <= input.clockInAt) {
    throw new Error("invalid_range");
  }

  if (input.clockOutAt > now) {
    throw new Error("future_correction_not_supported");
  }

  const result = await db.runTransaction(async (transaction) => {
    const [employeeSnapshot, clockInSnapshot, existingClockOutSnapshot] = await Promise.all([
      transaction.get(employeeRef),
      transaction.get(clockInRef),
      input.clockOutLogId ? transaction.get(clockOutRef) : Promise.resolve(null),
    ]);

    if (!employeeSnapshot.exists) {
      throw new Error("employee_not_found");
    }

    const employee = mapEmployee(employeeSnapshot.id, employeeSnapshot.data() ?? {});
    if (employee.store_id !== store.id) {
      throw new Error("employee_store_mismatch");
    }

    if (!clockInSnapshot.exists) {
      throw new Error("clock_in_not_found");
    }

    const clockInLog = mapTimelog(clockInSnapshot.id, clockInSnapshot.data() ?? {});
    if (clockInLog.employee_id !== input.employeeId || clockInLog.store_id !== store.id || clockInLog.type !== "IN") {
      throw new Error("invalid_clock_in");
    }

    transaction.update(clockInRef, {
      timestamp: input.clockInAt,
    });

    if (input.clockOutLogId) {
      if (!existingClockOutSnapshot?.exists) {
        throw new Error("clock_out_not_found");
      }

      const clockOutLog = mapTimelog(existingClockOutSnapshot.id, existingClockOutSnapshot.data() ?? {});
      if (
        clockOutLog.employee_id !== input.employeeId ||
        clockOutLog.store_id !== store.id ||
        clockOutLog.type !== "OUT"
      ) {
        throw new Error("invalid_clock_out");
      }

      transaction.update(clockOutRef, {
        timestamp: input.clockOutAt,
      });
    } else {
      transaction.create(clockOutRef, {
        employee_id: input.employeeId,
        store_id: store.id,
        type: "OUT",
        timestamp: input.clockOutAt,
      });
    }

    return {
      ok: true as const,
      clockOutLogId: clockOutRef.id,
    };
  });

  return result;
}

export async function saveReportCorrectionServer(input: {
  qrToken: string;
  employeeId: string;
  clockInLogId: string;
  clockOutLogId: string | null;
  clockInAt: Date;
  clockOutAt: Date;
}) {
  return saveReportCorrectionServerWithDb(adminDb, input);
}

function normalizeEmployeeNames(employeeNames: string[]) {
  return employeeNames.map((name) => name.trim()).filter(Boolean);
}

async function getStoreByIdWithDb(db: DbLike, storeId: string) {
  const snapshot = await db.collection("stores").get();
  const document = snapshot.docs.find((entry) => entry.id === storeId);
  return document ? mapStore(document.id, document.data()) : null;
}

async function assertUniqueEmployeeNameWithDb(
  db: DbLike,
  storeId: string,
  nextName: string,
  excludeEmployeeId?: string,
) {
  const normalizedName = normalizeEmployeeName(nextName);
  const employees = await getEmployeesByStoreIdWithDb(db, storeId);
  const duplicate = employees.find((employee) => {
    if (excludeEmployeeId && employee.id === excludeEmployeeId) {
      return false;
    }

    return normalizeEmployeeName(employee.name) === normalizedName;
  });

  if (duplicate) {
    throw new Error("duplicate_employee_name");
  }
}

export async function createStoreAndEmployeesServer(
  storeName: string,
  pin: string,
  employeeNames: string[],
) {
  const createdAt = new Date();
  const qrToken = await generateToken(16);
  const batch = adminDb.batch();

  const storeRef = adminDb.collection("stores").doc();
  batch.set(storeRef, {
    name: storeName.trim(),
    qr_token: qrToken,
    pin_hash: await hashPin(pin.trim()),
    created_at: createdAt,
  });

  for (const name of normalizeEmployeeNames(employeeNames)) {
    const employeeRef = adminDb.collection("employees").doc();
    batch.set(employeeRef, {
      name,
      store_id: storeRef.id,
      created_at: createdAt,
      status: "active",
    });
  }

  await batch.commit();

  return {
    storeId: storeRef.id,
    storeName: storeName.trim(),
    qrToken,
  };
}

export async function createDemoStoreWithTimelogsServer() {
  const demoSeed = buildDemoStoreSeed();
  const qrToken = await generateToken(16);
  const createdAt = new Date();
  const batch = adminDb.batch();

  const storeRef = adminDb.collection("stores").doc();
  batch.set(storeRef, {
    name: demoSeed.storeName,
    qr_token: qrToken,
    pin_hash: await hashPin(demoSeed.pin),
    created_at: createdAt,
  });

  const employeeIdByName = new Map<string, string>();
  for (const employeeName of demoSeed.employeeNames) {
    const employeeRef = adminDb.collection("employees").doc();
    employeeIdByName.set(employeeName, employeeRef.id);
    batch.set(employeeRef, {
      name: employeeName,
      store_id: storeRef.id,
      created_at: createdAt,
      status: "active",
    });
  }

  for (const timelog of demoSeed.timelogs) {
    const employeeId = employeeIdByName.get(timelog.employeeName);
    if (!employeeId) {
      continue;
    }

    const timelogRef = adminDb.collection("timelogs").doc();
    batch.set(timelogRef, {
      employee_id: employeeId,
      store_id: storeRef.id,
      type: timelog.type,
      timestamp: timelog.timestamp,
    });
  }

  await batch.commit();

  return {
    storeId: storeRef.id,
    storeName: demoSeed.storeName,
    qrToken,
    pin: demoSeed.pin,
  };
}

export async function createEmployeeForStoreWithDb(
  db: DbLike,
  storeId: string,
  name: string,
) {
  const trimmedName = name.trim();
  if (!trimmedName) {
    throw new Error("invalid_employee_name");
  }

  const store = await getStoreByIdWithDb(db, storeId);
  if (!store) {
    throw new Error("store_not_found");
  }

  await assertUniqueEmployeeNameWithDb(db, storeId, trimmedName);

  const createdAt = new Date();
  const employeeRef = db.collection("employees").doc();

  await db.runTransaction(async (transaction) => {
    transaction.create(employeeRef, {
      name: trimmedName,
      store_id: storeId,
      created_at: createdAt,
      status: "active",
    });
  });

  return mapEmployee(employeeRef.id, {
    name: trimmedName,
    store_id: storeId,
    created_at: createdAt,
    status: "active",
  });
}

export async function createEmployeeForStoreServer(storeId: string, name: string) {
  return createEmployeeForStoreWithDb(adminDb, storeId, name);
}

export async function updateEmployeeForStoreWithDb(
  db: DbLike,
  input: {
    storeId: string;
    employeeId: string;
    name?: string;
    status?: EmployeeStatus;
  },
) {
  const store = await getStoreByIdWithDb(db, input.storeId);
  if (!store) {
    throw new Error("store_not_found");
  }

  const employees = await getEmployeesByStoreIdWithDb(db, input.storeId);
  const employee = employees.find((entry) => entry.id === input.employeeId);
  if (!employee) {
    const foreignEmployeeSnapshot = await db.collection("employees").get();
    const existsElsewhere = foreignEmployeeSnapshot.docs.some((document) => document.id === input.employeeId);
    throw new Error(existsElsewhere ? "employee_store_mismatch" : "employee_not_found");
  }

  const patch: Record<string, unknown> = {};

  if (typeof input.name === "string") {
    const trimmedName = input.name.trim();
    if (!trimmedName) {
      throw new Error("invalid_employee_name");
    }

    await assertUniqueEmployeeNameWithDb(db, input.storeId, trimmedName, input.employeeId);
    patch.name = trimmedName;
  }

  if (input.status === "active" || input.status === "archived") {
    patch.status = input.status;
  }

  if (Object.keys(patch).length === 0) {
    throw new Error("no_employee_changes");
  }

  const employeeRef = db.collection("employees").doc(input.employeeId);
  await db.runTransaction(async (transaction) => {
    transaction.update(employeeRef, patch);
  });

  return mapEmployee(input.employeeId, {
    ...employee,
    ...patch,
  });
}

export async function updateEmployeeForStoreServer(input: {
  storeId: string;
  employeeId: string;
  name?: string;
  status?: EmployeeStatus;
}) {
  return updateEmployeeForStoreWithDb(adminDb, input);
}
