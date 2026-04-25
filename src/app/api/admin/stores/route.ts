import { NextRequest, NextResponse } from "next/server";

import { getOwnerSession } from "@/lib/server-auth";
import { createStoreAndEmployeesServer } from "@/lib/server-db";

export const runtime = "nodejs";

function isValidPin(pin: string) {
  return /^\d{1,6}$/.test(pin);
}

export async function POST(request: NextRequest) {
  if (!getOwnerSession(request)) {
    return NextResponse.json({ error: "Owner access is required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as {
    storeName?: string;
    pin?: string;
    employeeNames?: string[];
  } | null;

  const storeName = body?.storeName?.trim();
  const pin = body?.pin?.trim();
  const employeeNames = Array.isArray(body?.employeeNames) ? body.employeeNames : [];

  if (!storeName || !pin || employeeNames.length === 0) {
    return NextResponse.json(
      { error: "Add a store name, manager PIN, and at least one employee." },
      { status: 400 },
    );
  }

  if (!isValidPin(pin)) {
    return NextResponse.json({ error: "Manager PIN must be numeric and 6 digits or fewer." }, { status: 400 });
  }

  const result = await createStoreAndEmployeesServer(storeName, pin, employeeNames);
  return NextResponse.json(result);
}
