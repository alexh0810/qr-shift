import { NextRequest, NextResponse } from "next/server";

import { getManagerSession, isManagerSessionAuthorized } from "@/lib/server-auth";
import { getDashboardSnapshotByQrToken } from "@/lib/server-db";

export const runtime = "nodejs";

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

export async function GET(
  request: NextRequest,
  { params }: { params: { qr_token: string } },
) {
  const session = getManagerSession(request);
  if (!isManagerSessionAuthorized(session, params.qr_token)) {
    return NextResponse.json({ error: "Manager access is required." }, { status: 401 });
  }

  const snapshot = await getDashboardSnapshotByQrToken(params.qr_token);
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
}
