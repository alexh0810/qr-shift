import { NextRequest, NextResponse } from "next/server";

import { createClockAction } from "@/lib/server-db";

export const runtime = "nodejs";

export async function POST(
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
    const result = await createClockAction(params.qr_token, employeeId, requestedAction);
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
}
