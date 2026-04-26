import assert from "node:assert/strict";

import {
  createClockActionWithDb,
  getScanRosterByQrTokenWithDb,
  saveReportCorrectionServerWithDb,
} from "./server-db";

type TestCase = {
  name: string;
  run: () => Promise<void> | void;
};

type StoreRecord = {
  id: string;
  name: string;
  qr_token: string;
  created_at: Date;
  pin_hash?: string;
};

type EmployeeRecord = {
  id: string;
  name: string;
  store_id: string;
  created_at: Date;
};

type TimelogRecord = {
  id: string;
  employee_id: string;
  store_id: string;
  type: "IN" | "OUT";
  timestamp: Date;
};

type CollectionName = "stores" | "employees" | "timelogs";

function at(value: string): Date {
  return new Date(value);
}

function cloneRecord<T extends Record<string, unknown>>(record: T): T {
  const clone = { ...record } as T;
  for (const [key, value] of Object.entries(clone)) {
    if (value instanceof Date) {
      (clone as Record<string, unknown>)[key] = new Date(value);
    }
  }
  return clone;
}

class FakeDocSnapshot {
  constructor(
    public readonly id: string,
    private readonly payload: Record<string, unknown> | null,
  ) {}

  get exists() {
    return this.payload !== null;
  }

  data() {
    return this.payload ? cloneRecord(this.payload) : undefined;
  }
}

class FakeQuerySnapshot {
  constructor(public readonly docs: FakeDocSnapshot[]) {}

  get empty() {
    return this.docs.length === 0;
  }
}

type FakeDocRef = {
  __kind: "docRef";
  collection: CollectionName;
  id: string;
};

class FakeQuery {
  constructor(
    private readonly db: FakeDb,
    private readonly collection: CollectionName,
    private readonly filters: Array<{ field: string; value: unknown }> = [],
    private readonly limitCount: number | null = null,
  ) {}

  where(field: string, _op: "==", value: unknown) {
    return new FakeQuery(this.db, this.collection, [...this.filters, { field, value }], this.limitCount);
  }

  limit(count: number) {
    return new FakeQuery(this.db, this.collection, this.filters, count);
  }

  async get() {
    let docs = this.db.readCollection(this.collection).filter((record) =>
      this.filters.every((filter) => record[filter.field] === filter.value),
    );

    if (typeof this.limitCount === "number") {
      docs = docs.slice(0, this.limitCount);
    }

    return new FakeQuerySnapshot(
      docs.map((record) => new FakeDocSnapshot(String(record.id), cloneRecord(record))),
    );
  }
}

class FakeCollection {
  constructor(private readonly db: FakeDb, private readonly name: CollectionName) {}

  where(field: string, op: "==", value: unknown) {
    return new FakeQuery(this.db, this.name).where(field, op, value);
  }

  doc(id?: string): FakeDocRef {
    return {
      __kind: "docRef",
      collection: this.name,
      id: id ?? this.db.nextId(this.name),
    };
  }
}

class FakeTransaction {
  constructor(private readonly db: FakeDb) {}

  async get(target: FakeDocRef | FakeQuery) {
    if (target instanceof FakeQuery) {
      return target.get();
    }

    const record = this.db.getRecord(target.collection, target.id);
    return new FakeDocSnapshot(target.id, record ? cloneRecord(record) : null);
  }

  create(ref: FakeDocRef, data: Record<string, unknown>) {
    this.db.setRecord(ref.collection, ref.id, data, false);
  }

  update(ref: FakeDocRef, patch: Record<string, unknown>) {
    this.db.patchRecord(ref.collection, ref.id, patch);
  }
}

class FakeDb {
  private readonly collections: Record<CollectionName, Record<string, Record<string, unknown>>>;
  private readonly counters: Record<CollectionName, number>;

  constructor(seed: {
    stores?: StoreRecord[];
    employees?: EmployeeRecord[];
    timelogs?: TimelogRecord[];
  }) {
    this.collections = {
      stores: Object.fromEntries((seed.stores ?? []).map((record) => [record.id, cloneRecord(record)])),
      employees: Object.fromEntries((seed.employees ?? []).map((record) => [record.id, cloneRecord(record)])),
      timelogs: Object.fromEntries((seed.timelogs ?? []).map((record) => [record.id, cloneRecord(record)])),
    };
    this.counters = { stores: 0, employees: 0, timelogs: 0 };
  }

  collection(name: string) {
    return new FakeCollection(this, name as CollectionName);
  }

  async runTransaction<T>(updateFunction: (transaction: FakeTransaction) => Promise<T>) {
    return updateFunction(new FakeTransaction(this));
  }

  readCollection(name: CollectionName) {
    return Object.values(this.collections[name]).map((record) => cloneRecord(record));
  }

  getRecord(name: CollectionName, id: string) {
    const record = this.collections[name][id];
    return record ? cloneRecord(record) : null;
  }

  setRecord(name: CollectionName, id: string, record: Record<string, unknown>, allowOverwrite: boolean) {
    if (!allowOverwrite && this.collections[name][id]) {
      throw new Error(`record_exists:${name}:${id}`);
    }

    this.collections[name][id] = { id, ...cloneRecord(record) };
  }

  patchRecord(name: CollectionName, id: string, patch: Record<string, unknown>) {
    const existing = this.collections[name][id];
    if (!existing) {
      throw new Error(`record_missing:${name}:${id}`);
    }

    this.collections[name][id] = { ...existing, ...cloneRecord(patch) };
  }

  nextId(name: CollectionName) {
    this.counters[name] += 1;
    return `${name}-${this.counters[name]}`;
  }
}

const tests: TestCase[] = [
  {
    name: "builds scan roster statuses from latest employee logs",
    run: async () => {
      const db = new FakeDb({
        stores: [{ id: "store-1", name: "Demo", qr_token: "qr-1", created_at: at("2026-04-01T00:00:00Z") }],
        employees: [
          { id: "emp-1", name: "Alex", store_id: "store-1", created_at: at("2026-04-01T00:00:00Z") },
          { id: "emp-2", name: "Kim", store_id: "store-1", created_at: at("2026-04-01T00:00:00Z") },
        ],
        timelogs: [
          { id: "log-1", employee_id: "emp-1", store_id: "store-1", type: "IN", timestamp: at("2026-04-25T09:00:00Z") },
          { id: "log-2", employee_id: "emp-2", store_id: "store-1", type: "IN", timestamp: at("2026-04-25T08:00:00Z") },
          { id: "log-3", employee_id: "emp-2", store_id: "store-1", type: "OUT", timestamp: at("2026-04-25T16:00:00Z") },
        ],
      });

      const roster = await getScanRosterByQrTokenWithDb(db, "qr-1");

      assert.ok(roster);
      assert.equal(roster?.employees[0]?.status, "IN");
      assert.equal(roster?.employees[1]?.status, "OUT");
      assert.equal(roster?.employees[1]?.latestLog?.id, "log-3");
    },
  },
  {
    name: "creates a valid clock-in action and appends a new timelog",
    run: async () => {
      const db = new FakeDb({
        stores: [{ id: "store-1", name: "Demo", qr_token: "qr-1", created_at: at("2026-04-01T00:00:00Z") }],
        employees: [{ id: "emp-1", name: "Alex", store_id: "store-1", created_at: at("2026-04-01T00:00:00Z") }],
      });

      const result = await createClockActionWithDb(db, "qr-1", "emp-1", "IN");

      assert.equal(result.action, "IN");
      const timelogs = db.readCollection("timelogs");
      assert.equal(timelogs.length, 1);
      assert.equal(timelogs[0]?.employee_id, "emp-1");
      assert.equal(timelogs[0]?.type, "IN");
    },
  },
  {
    name: "rejects invalid clock transitions based on the latest log",
    run: async () => {
      const db = new FakeDb({
        stores: [{ id: "store-1", name: "Demo", qr_token: "qr-1", created_at: at("2026-04-01T00:00:00Z") }],
        employees: [{ id: "emp-1", name: "Alex", store_id: "store-1", created_at: at("2026-04-01T00:00:00Z") }],
        timelogs: [{ id: "log-1", employee_id: "emp-1", store_id: "store-1", type: "IN", timestamp: at("2026-04-25T09:00:00Z") }],
      });

      await assert.rejects(
        () => createClockActionWithDb(db, "qr-1", "emp-1", "IN"),
        /invalid_transition/,
      );
    },
  },
  {
    name: "persists a completed report correction by updating existing IN and OUT logs",
    run: async () => {
      const db = new FakeDb({
        stores: [{ id: "store-1", name: "Demo", qr_token: "qr-1", created_at: at("2026-04-01T00:00:00Z") }],
        employees: [{ id: "emp-1", name: "Alex", store_id: "store-1", created_at: at("2026-04-01T00:00:00Z") }],
        timelogs: [
          { id: "in-1", employee_id: "emp-1", store_id: "store-1", type: "IN", timestamp: at("2026-04-24T09:00:00Z") },
          { id: "out-1", employee_id: "emp-1", store_id: "store-1", type: "OUT", timestamp: at("2026-04-24T23:59:00Z") },
        ],
      });

      const result = await saveReportCorrectionServerWithDb(db, {
        qrToken: "qr-1",
        employeeId: "emp-1",
        clockInLogId: "in-1",
        clockOutLogId: "out-1",
        clockInAt: at("2026-04-24T09:15:00Z"),
        clockOutAt: at("2026-04-24T17:00:00Z"),
      });

      assert.equal(result.ok, true);
      const updatedIn = db.getRecord("timelogs", "in-1");
      const updatedOut = db.getRecord("timelogs", "out-1");
      assert.equal((updatedIn?.timestamp as Date).toISOString(), at("2026-04-24T09:15:00Z").toISOString());
      assert.equal((updatedOut?.timestamp as Date).toISOString(), at("2026-04-24T17:00:00Z").toISOString());
    },
  },
  {
    name: "creates a missing clock-out log when saving a completed correction",
    run: async () => {
      const db = new FakeDb({
        stores: [{ id: "store-1", name: "Demo", qr_token: "qr-1", created_at: at("2026-04-01T00:00:00Z") }],
        employees: [{ id: "emp-1", name: "Alex", store_id: "store-1", created_at: at("2026-04-01T00:00:00Z") }],
        timelogs: [{ id: "in-1", employee_id: "emp-1", store_id: "store-1", type: "IN", timestamp: at("2026-04-24T09:00:00Z") }],
      });

      const result = await saveReportCorrectionServerWithDb(db, {
        qrToken: "qr-1",
        employeeId: "emp-1",
        clockInLogId: "in-1",
        clockOutLogId: null,
        clockInAt: at("2026-04-24T09:00:00Z"),
        clockOutAt: at("2026-04-24T17:00:00Z"),
      });

      assert.equal(result.ok, true);
      const timelogs = db.readCollection("timelogs");
      assert.equal(timelogs.length, 2);
      const createdOut = timelogs.find((log) => log.id === result.clockOutLogId);
      assert.equal(createdOut?.type, "OUT");
    },
  },
];

let failed = 0;

async function run() {
  for (const currentTest of tests) {
    try {
      await currentTest.run();
      console.log(`PASS ${currentTest.name}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${currentTest.name}`);
      console.error(error);
    }
  }

  if (failed > 0) {
    process.exitCode = 1;
    throw new Error(`${failed} server-db test(s) failed`);
  }

  console.log(`Passed ${tests.length} server-db tests`);
}

run().catch((error) => {
  throw error;
});
