import assert from "node:assert/strict";

import { NextRequest } from "next/server";

import {
  createClockPostHandler,
  createDashboardGetHandler,
  createPublicStoreGetHandler,
  createReportsGetHandler,
  createReportsPostHandler,
  createScanRosterGetHandler,
} from "./route-workflow-helpers";

type TestCase = {
  name: string;
  run: () => Promise<void> | void;
};

function at(value: string): Date {
  return new Date(value);
}

function makeRequest(url: string, init?: ConstructorParameters<typeof NextRequest>[1]) {
  return new NextRequest(url, init);
}

const managerSession = {
  kind: "manager" as const,
  storeId: "store-1",
  qrToken: "qr-1",
  exp: Date.now() + 60_000,
};

const baseDependencies = {
  getManagerSession: () => managerSession,
  isManagerSessionAuthorized: () => true,
};

const tests: TestCase[] = [
  {
    name: "public store route returns 404 when the qr token is unknown",
    run: async () => {
      const GET = createPublicStoreGetHandler({
        getStoreByQrTokenServer: async () => null,
        toPublicStore: (store) => ({
          id: store.id,
          name: store.name,
          qr_token: store.qr_token,
        }),
      });

      const response = await GET(makeRequest("http://localhost/api/stores/missing"), {
        params: { qr_token: "missing" },
      });

      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { error: "Store not found." });
    },
  },
  {
    name: "public store route returns the scan-safe store payload",
    run: async () => {
      const GET = createPublicStoreGetHandler({
        getStoreByQrTokenServer: async () => ({
          id: "store-1",
          name: "Demo Store",
          qr_token: "qr-1",
          created_at: at("2026-04-01T00:00:00Z"),
          pin_hash: "secret",
        }),
        toPublicStore: (store) => ({
          id: store.id,
          name: store.name,
          qr_token: store.qr_token,
        }),
      });

      const response = await GET(makeRequest("http://localhost/api/stores/qr-1"), {
        params: { qr_token: "qr-1" },
      });

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        store: {
          id: "store-1",
          name: "Demo Store",
          qr_token: "qr-1",
        },
      });
    },
  },
  {
    name: "scan roster route returns 404 when the qr token is unknown",
    run: async () => {
      const GET = createScanRosterGetHandler({
        getScanRosterByQrToken: async () => null,
      });

      const response = await GET(makeRequest("http://localhost/api/stores/missing/employees"), {
        params: { qr_token: "missing" },
      });

      assert.equal(response.status, 404);
      assert.deepEqual(await response.json(), { error: "Store not found." });
    },
  },
  {
    name: "scan roster route serializes employee timestamps and latest logs",
    run: async () => {
      const GET = createScanRosterGetHandler({
        getScanRosterByQrToken: async () => ({
          store: { id: "store-1", name: "Demo Store", qr_token: "qr-1" },
          employees: [
            {
              employee: {
                id: "emp-1",
                name: "Alex",
                store_id: "store-1",
                created_at: at("2026-04-01T00:00:00Z"),
              },
              latestLog: {
                id: "log-1",
                employee_id: "emp-1",
                store_id: "store-1",
                type: "OUT" as const,
                timestamp: at("2026-04-25T17:00:00Z"),
              },
              status: "OUT" as const,
            },
          ],
        }),
      });

      const response = await GET(makeRequest("http://localhost/api/stores/qr-1/employees"), {
        params: { qr_token: "qr-1" },
      });
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.store.name, "Demo Store");
      assert.equal(payload.employees[0].employee.created_at, "2026-04-01T00:00:00.000Z");
      assert.equal(payload.employees[0].latest_log.timestamp, "2026-04-25T17:00:00.000Z");
      assert.equal(payload.employees[0].status, "OUT");
    },
  },
  {
    name: "scan clock route rejects invalid request bodies",
    run: async () => {
      const POST = createClockPostHandler({
        createClockAction: async () => {
          throw new Error("should_not_be_called");
        },
      });

      const response = await POST(
        makeRequest("http://localhost/api/stores/qr-1/clock", {
          method: "POST",
          body: JSON.stringify({ employeeId: "", requestedAction: "IN" }),
          headers: { "Content-Type": "application/json" },
        }),
        { params: { qr_token: "qr-1" } },
      );

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "Choose an employee and confirm the next action." });
    },
  },
  {
    name: "scan clock route maps invalid transition errors to customer-safe copy",
    run: async () => {
      const POST = createClockPostHandler({
        createClockAction: async () => {
          throw new Error("invalid_transition");
        },
      });

      const response = await POST(
        makeRequest("http://localhost/api/stores/qr-1/clock", {
          method: "POST",
          body: JSON.stringify({ employeeId: "emp-1", requestedAction: "IN" }),
          headers: { "Content-Type": "application/json" },
        }),
        { params: { qr_token: "qr-1" } },
      );

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "This shift status changed. Go back and try again." });
    },
  },
  {
    name: "scan clock route returns action and timestamp on success",
    run: async () => {
      const POST = createClockPostHandler({
        createClockAction: async () => ({
          employee: {
            id: "emp-1",
            name: "Alex",
            store_id: "store-1",
            created_at: at("2026-04-01T00:00:00Z"),
          },
          action: "OUT" as const,
          timestamp: at("2026-04-26T10:00:00Z"),
        }),
      });

      const response = await POST(
        makeRequest("http://localhost/api/stores/qr-1/clock", {
          method: "POST",
          body: JSON.stringify({ employeeId: "emp-1", requestedAction: "OUT" }),
          headers: { "Content-Type": "application/json" },
        }),
        { params: { qr_token: "qr-1" } },
      );

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), {
        action: "OUT",
        timestamp: "2026-04-26T10:00:00.000Z",
      });
    },
  },
  {
    name: "dashboard route rejects unauthorized manager requests",
    run: async () => {
      const GET = createDashboardGetHandler({
        getManagerSession: () => null,
        isManagerSessionAuthorized: () => false,
        getDashboardSnapshotByQrToken: async () => {
          throw new Error("should_not_be_called");
        },
      });

      const response = await GET(makeRequest("http://localhost/api/manager/qr-1/dashboard"), {
        params: { qr_token: "qr-1" },
      });

      assert.equal(response.status, 401);
      assert.deepEqual(await response.json(), { error: "Manager access is required." });
    },
  },
  {
    name: "dashboard route serializes employee status snapshots",
    run: async () => {
      const GET = createDashboardGetHandler({
        ...baseDependencies,
        getDashboardSnapshotByQrToken: async () => ({
          store: { id: "store-1", name: "Demo Store", qr_token: "qr-1" },
          employees: [
            {
              employee: {
                id: "emp-1",
                name: "Alex",
                store_id: "store-1",
                created_at: at("2026-04-01T00:00:00Z"),
              },
              latestLog: {
                id: "log-1",
                employee_id: "emp-1",
                store_id: "store-1",
                type: "IN" as const,
                timestamp: at("2026-04-26T08:00:00Z"),
              },
              status: "IN" as const,
            },
          ],
        }),
      });

      const response = await GET(makeRequest("http://localhost/api/manager/qr-1/dashboard"), {
        params: { qr_token: "qr-1" },
      });
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.store.name, "Demo Store");
      assert.equal(payload.employees[0].employee.created_at, "2026-04-01T00:00:00.000Z");
      assert.equal(payload.employees[0].latest_log.timestamp, "2026-04-26T08:00:00.000Z");
      assert.equal(payload.employees[0].status, "IN");
    },
  },
  {
    name: "reports route serializes employees and timelogs on GET",
    run: async () => {
      const GET = createReportsGetHandler({
        ...baseDependencies,
        getReportsSnapshotByQrToken: async () => ({
          store: { id: "store-1", name: "Demo Store", qr_token: "qr-1" },
          employees: [
            {
              id: "emp-1",
              name: "Alex",
              store_id: "store-1",
              created_at: at("2026-04-01T00:00:00Z"),
            },
          ],
          timelogs: [
            {
              id: "log-1",
              employee_id: "emp-1",
              store_id: "store-1",
              type: "IN" as const,
              timestamp: at("2026-04-26T08:00:00Z"),
            },
          ],
        }),
        saveReportCorrectionServer: async () => {
          throw new Error("should_not_be_called");
        },
      });

      const response = await GET(makeRequest("http://localhost/api/manager/qr-1/reports"), {
        params: { qr_token: "qr-1" },
      });
      const payload = await response.json();

      assert.equal(response.status, 200);
      assert.equal(payload.employees[0].created_at, "2026-04-01T00:00:00.000Z");
      assert.equal(payload.timelogs[0].timestamp, "2026-04-26T08:00:00.000Z");
    },
  },
  {
    name: "reports correction route rejects invalid payloads",
    run: async () => {
      const POST = createReportsPostHandler({
        ...baseDependencies,
        getReportsSnapshotByQrToken: async () => null,
        saveReportCorrectionServer: async () => {
          throw new Error("should_not_be_called");
        },
      });

      const response = await POST(
        makeRequest("http://localhost/api/manager/qr-1/reports", {
          method: "POST",
          body: JSON.stringify({ employeeId: "emp-1" }),
          headers: { "Content-Type": "application/json" },
        }),
        { params: { qr_token: "qr-1" } },
      );

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "Invalid report correction." });
    },
  },
  {
    name: "reports correction route maps future correction errors to customer-safe copy",
    run: async () => {
      const POST = createReportsPostHandler({
        ...baseDependencies,
        getReportsSnapshotByQrToken: async () => null,
        saveReportCorrectionServer: async () => {
          throw new Error("future_correction_not_supported");
        },
      });

      const response = await POST(
        makeRequest("http://localhost/api/manager/qr-1/reports", {
          method: "POST",
          body: JSON.stringify({
            employeeId: "emp-1",
            clockInLogId: "in-1",
            clockOutLogId: null,
            clockInAt: "2026-04-26T08:00:00.000Z",
            clockOutAt: "2026-04-26T17:00:00.000Z",
          }),
          headers: { "Content-Type": "application/json" },
        }),
        { params: { qr_token: "qr-1" } },
      );

      assert.equal(response.status, 400);
      assert.deepEqual(await response.json(), { error: "Only completed shifts can be saved right now." });
    },
  },
  {
    name: "reports correction route returns saved correction metadata on success",
    run: async () => {
      const POST = createReportsPostHandler({
        ...baseDependencies,
        getReportsSnapshotByQrToken: async () => null,
        saveReportCorrectionServer: async () => ({
          ok: true as const,
          clockOutLogId: "out-1",
        }),
      });

      const response = await POST(
        makeRequest("http://localhost/api/manager/qr-1/reports", {
          method: "POST",
          body: JSON.stringify({
            employeeId: "emp-1",
            clockInLogId: "in-1",
            clockOutLogId: "out-1",
            clockInAt: "2026-04-24T09:00:00.000Z",
            clockOutAt: "2026-04-24T17:00:00.000Z",
          }),
          headers: { "Content-Type": "application/json" },
        }),
        { params: { qr_token: "qr-1" } },
      );

      assert.equal(response.status, 200);
      assert.deepEqual(await response.json(), { ok: true, clockOutLogId: "out-1" });
    },
  },
  {
    name: "workflow smoke test chains scan clock action into dashboard and reports snapshots",
    run: async () => {
      const state = {
        store: {
          id: "store-1",
          name: "Demo Store",
          qr_token: "qr-1",
          created_at: at("2026-04-01T00:00:00Z"),
        },
        employee: {
          id: "emp-1",
          name: "Alex",
          store_id: "store-1",
          created_at: at("2026-04-01T00:00:00Z"),
        },
        timelogs: [] as Array<{
          id: string;
          employee_id: string;
          store_id: string;
          type: "IN" | "OUT";
          timestamp: Date;
        }>,
      };

      const createClockAction = async (_qrToken: string, employeeId: string, requestedAction: "IN" | "OUT") => {
        const latestLog = state.timelogs[state.timelogs.length - 1] ?? null;
        const expectedAction = latestLog?.type === "IN" ? "OUT" : "IN";
        assert.equal(employeeId, state.employee.id);
        assert.equal(requestedAction, expectedAction);

        const newLog = {
          id: `log-${state.timelogs.length + 1}`,
          employee_id: employeeId,
          store_id: state.store.id,
          type: requestedAction,
          timestamp: at("2026-04-26T09:00:00Z"),
        };
        state.timelogs.push(newLog);

        return {
          employee: state.employee,
          action: requestedAction,
          timestamp: newLog.timestamp,
        };
      };

      const getDashboardSnapshotByQrToken = async () => ({
        store: { id: state.store.id, name: state.store.name, qr_token: state.store.qr_token },
        employees: [
          {
            employee: state.employee,
            latestLog: state.timelogs[state.timelogs.length - 1] ?? null,
            status: state.timelogs[state.timelogs.length - 1]?.type === "IN" ? ("IN" as const) : ("OUT" as const),
          },
        ],
      });

      const getReportsSnapshotByQrToken = async () => ({
        store: { id: state.store.id, name: state.store.name, qr_token: state.store.qr_token },
        employees: [state.employee],
        timelogs: [...state.timelogs],
      });

      const POST = createClockPostHandler({ createClockAction });
      const dashboardGET = createDashboardGetHandler({
        ...baseDependencies,
        getDashboardSnapshotByQrToken,
      });
      const reportsGET = createReportsGetHandler({
        ...baseDependencies,
        getReportsSnapshotByQrToken,
        saveReportCorrectionServer: async () => {
          throw new Error("should_not_be_called");
        },
      });

      const clockResponse = await POST(
        makeRequest("http://localhost/api/stores/qr-1/clock", {
          method: "POST",
          body: JSON.stringify({ employeeId: "emp-1", requestedAction: "IN" }),
          headers: { "Content-Type": "application/json" },
        }),
        { params: { qr_token: "qr-1" } },
      );
      assert.equal(clockResponse.status, 200);

      const dashboardResponse = await dashboardGET(
        makeRequest("http://localhost/api/manager/qr-1/dashboard"),
        { params: { qr_token: "qr-1" } },
      );
      const dashboardPayload = await dashboardResponse.json();
      assert.equal(dashboardPayload.employees[0].status, "IN");
      assert.equal(dashboardPayload.employees[0].latest_log.type, "IN");

      const reportsResponse = await reportsGET(
        makeRequest("http://localhost/api/manager/qr-1/reports"),
        { params: { qr_token: "qr-1" } },
      );
      const reportsPayload = await reportsResponse.json();
      assert.equal(reportsResponse.status, 200);
      assert.equal(reportsPayload.timelogs.length, 1);
      assert.equal(reportsPayload.timelogs[0].type, "IN");
      assert.equal(reportsPayload.timelogs[0].timestamp, "2026-04-26T09:00:00.000Z");
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
    throw new Error(`${failed} route workflow test(s) failed`);
  }

  console.log(`Passed ${tests.length} route workflow tests`);
}

run().catch((error) => {
  throw error;
});
