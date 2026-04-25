import { NextRequest, NextResponse } from "next/server";

import { getOwnerSession } from "@/lib/server-auth";
import { createDemoStoreWithTimelogsServer } from "@/lib/server-db";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!getOwnerSession(request)) {
    return NextResponse.json({ error: "Owner access is required." }, { status: 401 });
  }

  const result = await createDemoStoreWithTimelogsServer();
  return NextResponse.json(result);
}
