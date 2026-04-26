import { NextRequest, NextResponse } from "next/server";

import { getManagerSession, isManagerSessionAuthorized } from "./server-auth";
import {
  createClockAction,
  getDashboardSnapshotByQrToken,
  getReportsSnapshotByQrToken,
  getScanRosterByQrToken,
  getStoreByQrTokenServer,
  saveReportCorrectionServer,
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
      employees: snapshot.employees.map((employee) => ({
        ...employee,
        created_at: employee.created_at.toISOString(),
      })),
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
