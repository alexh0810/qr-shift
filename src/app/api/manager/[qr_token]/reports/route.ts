import { NextRequest, NextResponse } from "next/server";

import { getManagerSession, isManagerSessionAuthorized } from "@/lib/server-auth";
import { getReportsSnapshotByQrToken } from "@/lib/server-db";

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
