import { NextRequest, NextResponse } from "next/server";

import { getManagerSession, getOwnerSession, isManagerSessionAuthorized } from "./server-auth";
import {
  createClockAction,
  createEmployeeForStoreServer,
  getDashboardSnapshotByQrToken,
  getOwnerStoreRosterServer,
  getOwnerStoreSummariesServer,
  getReportsSnapshotByQrToken,
  getScanRosterByQrToken,
  getStoreByQrTokenServer,
  saveReportCorrectionServer,
  updateEmployeeForStoreServer,
  toPublicStore,
} from "./server-db";

type ClockRouteDependencies = {
  createClockAction: typeof createClockAction;
};

type PublicStoreRouteDependencies = {
  getStoreByQrTokenServer: typeof getStoreByQrTokenServer;
  toPublicStore: typeof toPublicStore;
};

type ScanRosterRouteDependencies = {
  getScanRosterByQrToken: typeof getScanRosterByQrToken;
};

type DashboardRouteDependencies = {
  getManagerSession: typeof getManagerSession;
  isManagerSessionAuthorized: typeof isManagerSessionAuthorized;
  getDashboardSnapshotByQrToken: typeof getDashboardSnapshotByQrToken;
};

type OwnerStoresRouteDependencies = {
  getOwnerSession: typeof getOwnerSession;
  getOwnerStoreSummariesServer: typeof getOwnerStoreSummariesServer;
};

type OwnerStoreRosterRouteDependencies = {
  getOwnerSession: typeof getOwnerSession;
  getOwnerStoreRosterServer: typeof getOwnerStoreRosterServer;
  createEmployeeForStoreServer: typeof createEmployeeForStoreServer;
  updateEmployeeForStoreServer: typeof updateEmployeeForStoreServer;
};

type ReportsRouteDependencies = {
  getManagerSession: typeof getManagerSession;
  isManagerSessionAuthorized: typeof isManagerSessionAuthorized;
  getReportsSnapshotByQrToken: typeof getReportsSnapshotByQrToken;
  saveReportCorrectionServer: typeof saveReportCorrectionServer;
};

function serializeTimelog(
  timelog: {
    id: string;
    employee_id: string;
    store_id: string;
    type: "IN" | "OUT";
    timestamp: Date;
  } | null,
) {
  if (!timelog) {
    return null;
  }

  return {
    ...timelog,
    timestamp: timelog.timestamp.toISOString(),
  };
}

function serializeEmployee(employee: {
  id: string;
  name: string;
  store_id: string;
  created_at: Date;
  status: "active" | "archived";
}) {
  return {
    ...employee,
    created_at: employee.created_at.toISOString(),
  };
}

export function createClockPostHandler(dependencies: ClockRouteDependencies) {
  return async function POST(
    request: NextRequest,
    { params }: { params: { qr_token: string } },
  ) {
    const body = (await request.json().catch(() => null)) as {
      employeeId?: string;
      requestedAction?: "IN" | "OUT";
    } | null;

    const employeeId = body?.employeeId?.trim();
    const requestedAction = body?.requestedAction;

    if (!employeeId || (requestedAction !== "IN" && requestedAction !== "OUT")) {
      return NextResponse.json(
        { error: "Choose an employee and confirm the next action." },
        { status: 400 },
      );
    }

    try {
      const result = await dependencies.createClockAction(params.qr_token, employeeId, requestedAction);
      return NextResponse.json({
        action: result.action,
        timestamp: result.timestamp.toISOString(),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "clock_failed";
      const errorMessage =
        message === "invalid_transition"
          ? "This shift status changed. Go back and try again."
          : "QRShift couldn't save that clock action. Try again.";

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
  };
}

export function createPublicStoreGetHandler(dependencies: PublicStoreRouteDependencies) {
  return async function GET(
    _request: NextRequest,
    { params }: { params: { qr_token: string } },
  ) {
    const store = await dependencies.getStoreByQrTokenServer(params.qr_token);
    if (!store) {
      return NextResponse.json({ error: "Store not found." }, { status: 404 });
    }

    return NextResponse.json({
      store: dependencies.toPublicStore(store),
    });
  };
}

export function createScanRosterGetHandler(dependencies: ScanRosterRouteDependencies) {
  return async function GET(
    _request: NextRequest,
    { params }: { params: { qr_token: string } },
  ) {
    const roster = await dependencies.getScanRosterByQrToken(params.qr_token);
    if (!roster) {
      return NextResponse.json({ error: "Store not found." }, { status: 404 });
    }

    return NextResponse.json({
      store: roster.store,
      employees: roster.employees.map((entry) => ({
        employee: {
          ...entry.employee,
          created_at: entry.employee.created_at.toISOString(),
        },
        latest_log: serializeTimelog(entry.latestLog),
        status: entry.status,
      })),
    });
  };
}

export function createDashboardGetHandler(dependencies: DashboardRouteDependencies) {
  return async function GET(
    request: NextRequest,
    { params }: { params: { qr_token: string } },
  ) {
    const session = dependencies.getManagerSession(request);
    if (!dependencies.isManagerSessionAuthorized(session, params.qr_token)) {
      return NextResponse.json({ error: "Manager access is required." }, { status: 401 });
    }

    const snapshot = await dependencies.getDashboardSnapshotByQrToken(params.qr_token);
    if (!snapshot) {
      return NextResponse.json({ error: "Store not found." }, { status: 404 });
    }

    return NextResponse.json({
      store: snapshot.store,
      employees: snapshot.employees.map((entry) => ({
        employee: {
          ...entry.employee,
          created_at: entry.employee.created_at.toISOString(),
        },
        latest_log: serializeTimelog(entry.latestLog),
        status: entry.status,
      })),
    });
  };
}

export function createOwnerStoresGetHandler(dependencies: OwnerStoresRouteDependencies) {
  return async function GET(request: NextRequest) {
    if (!dependencies.getOwnerSession(request)) {
      return NextResponse.json({ error: "Owner access is required." }, { status: 401 });
    }

    const stores = await dependencies.getOwnerStoreSummariesServer();

    return NextResponse.json({
      stores: stores.map((store) => ({
        ...store,
        created_at: store.created_at.toISOString(),
      })),
    });
  };
}

export function createOwnerStoreRosterGetHandler(dependencies: OwnerStoreRosterRouteDependencies) {
  return async function GET(
    request: NextRequest,
    { params }: { params: { storeId: string } },
  ) {
    if (!dependencies.getOwnerSession(request)) {
      return NextResponse.json({ error: "Owner access is required." }, { status: 401 });
    }

    const roster = await dependencies.getOwnerStoreRosterServer(params.storeId);
    if (!roster) {
      return NextResponse.json({ error: "Store not found." }, { status: 404 });
    }

    return NextResponse.json({
      store: {
        ...roster.store,
        created_at: roster.store.created_at.toISOString(),
      },
      employees: roster.employees.map(serializeEmployee),
    });
  };
}

export function createOwnerStoreRosterPostHandler(dependencies: OwnerStoreRosterRouteDependencies) {
  return async function POST(
    request: NextRequest,
    { params }: { params: { storeId: string } },
  ) {
    if (!dependencies.getOwnerSession(request)) {
      return NextResponse.json({ error: "Owner access is required." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { name?: string } | null;
    const name = body?.name?.trim();

    if (!name) {
      return NextResponse.json({ error: "Enter an employee name." }, { status: 400 });
    }

    try {
      const employee = await dependencies.createEmployeeForStoreServer(params.storeId, name);
      return NextResponse.json({ employee: serializeEmployee(employee) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "employee_create_failed";
      const errorMessage =
        message === "store_not_found"
          ? "Store not found."
          : message === "duplicate_employee_name"
            ? "An employee with that name already exists for this store."
            : message === "invalid_employee_name"
              ? "Enter an employee name."
              : "QRShift couldn't add that employee. Try again.";

      return NextResponse.json({ error: errorMessage }, { status: message === "store_not_found" ? 404 : 400 });
    }
  };
}

export function createOwnerStoreEmployeePatchHandler(dependencies: OwnerStoreRosterRouteDependencies) {
  return async function PATCH(
    request: NextRequest,
    { params }: { params: { storeId: string; employeeId: string } },
  ) {
    if (!dependencies.getOwnerSession(request)) {
      return NextResponse.json({ error: "Owner access is required." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      name?: string;
      status?: "active" | "archived";
    } | null;

    try {
      const employee = await dependencies.updateEmployeeForStoreServer({
        storeId: params.storeId,
        employeeId: params.employeeId,
        name: typeof body?.name === "string" ? body.name : undefined,
        status: body?.status,
      });

      return NextResponse.json({ employee: serializeEmployee(employee) });
    } catch (error) {
      const message = error instanceof Error ? error.message : "employee_update_failed";
      const status =
        message === "store_not_found" || message === "employee_not_found"
          ? 404
          : message === "employee_store_mismatch"
            ? 400
            : 400;
      const errorMessage =
        message === "store_not_found"
          ? "Store not found."
          : message === "employee_not_found"
            ? "Employee not found."
            : message === "employee_store_mismatch"
              ? "This employee does not belong to the selected store."
              : message === "duplicate_employee_name"
                ? "An employee with that name already exists for this store."
                : message === "invalid_employee_name"
                  ? "Enter an employee name."
                  : message === "no_employee_changes"
                    ? "No employee changes were provided."
                    : "QRShift couldn't update that employee. Try again.";

      return NextResponse.json({ error: errorMessage }, { status });
    }
  };
}

export function createReportsGetHandler(dependencies: ReportsRouteDependencies) {
  return async function GET(
    request: NextRequest,
    { params }: { params: { qr_token: string } },
  ) {
    const session = dependencies.getManagerSession(request);
    if (!dependencies.isManagerSessionAuthorized(session, params.qr_token)) {
      return NextResponse.json({ error: "Manager access is required." }, { status: 401 });
    }

    const snapshot = await dependencies.getReportsSnapshotByQrToken(params.qr_token);
    if (!snapshot) {
      return NextResponse.json({ error: "Store not found." }, { status: 404 });
    }

    return NextResponse.json({
      store: snapshot.store,
      employees: snapshot.employees.map(serializeEmployee),
      timelogs: snapshot.timelogs.map((timelog) => ({
        ...timelog,
        timestamp: timelog.timestamp.toISOString(),
      })),
    });
  };
}

export function createReportsPostHandler(dependencies: ReportsRouteDependencies) {
  return async function POST(
    request: NextRequest,
    { params }: { params: { qr_token: string } },
  ) {
    const session = dependencies.getManagerSession(request);
    if (!dependencies.isManagerSessionAuthorized(session, params.qr_token)) {
      return NextResponse.json({ error: "Manager access is required." }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as {
      employeeId?: string;
      clockInLogId?: string;
      clockOutLogId?: string | null;
      clockInAt?: string;
      clockOutAt?: string;
    } | null;

    const employeeId = body?.employeeId?.trim();
    const clockInLogId = body?.clockInLogId?.trim();
    const clockOutLogId = typeof body?.clockOutLogId === "string" ? body.clockOutLogId.trim() : null;
    const clockInAt = body?.clockInAt ? new Date(body.clockInAt) : null;
    const clockOutAt = body?.clockOutAt ? new Date(body.clockOutAt) : null;

    if (
      !employeeId ||
      !clockInLogId ||
      !clockInAt ||
      Number.isNaN(clockInAt.getTime()) ||
      !clockOutAt ||
      Number.isNaN(clockOutAt.getTime())
    ) {
      return NextResponse.json({ error: "Invalid report correction." }, { status: 400 });
    }

    try {
      const result = await dependencies.saveReportCorrectionServer({
        qrToken: params.qr_token,
        employeeId,
        clockInLogId,
        clockOutLogId,
        clockInAt,
        clockOutAt,
      });

      return NextResponse.json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : "report_correction_failed";
      if (message !== "invalid_range" && message !== "future_correction_not_supported") {
        console.error("Failed to save report correction", {
          qrToken: params.qr_token,
          employeeId,
          clockInLogId,
          clockOutLogId,
          message,
        });
      }

      const errorMessage =
        message === "invalid_range"
          ? "Clock-out must be after clock-in."
          : message === "future_correction_not_supported"
            ? "Only completed shifts can be saved right now."
            : "QRShift couldn't save that report correction. Try again.";

      return NextResponse.json({ error: errorMessage }, { status: 400 });
    }
  };
}
