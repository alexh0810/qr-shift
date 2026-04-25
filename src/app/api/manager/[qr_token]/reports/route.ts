import { NextRequest, NextResponse } from "next/server";

import { getManagerSession, isManagerSessionAuthorized } from "@/lib/server-auth";
import { getReportsSnapshotByQrToken, saveReportCorrectionServer } from "@/lib/server-db";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { qr_token: string } },
) {
  const session = getManagerSession(request);
  if (!isManagerSessionAuthorized(session, params.qr_token)) {
    return NextResponse.json({ error: "Manager access is required." }, { status: 401 });
  }

  const snapshot = await getReportsSnapshotByQrToken(params.qr_token);
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
}

export async function POST(
  request: NextRequest,
  { params }: { params: { qr_token: string } },
) {
  const session = getManagerSession(request);
  if (!isManagerSessionAuthorized(session, params.qr_token)) {
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
    const result = await saveReportCorrectionServer({
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
}
