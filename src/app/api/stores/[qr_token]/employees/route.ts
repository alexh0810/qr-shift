import { NextRequest, NextResponse } from "next/server";

import { getScanRosterByQrToken } from "@/lib/server-db";

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
  _request: NextRequest,
  { params }: { params: { qr_token: string } },
) {
  const roster = await getScanRosterByQrToken(params.qr_token);
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
}
