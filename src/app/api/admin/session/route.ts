import { NextRequest, NextResponse } from "next/server";

import {
  clearOwnerSessionCookie,
  getOwnerSession,
  setOwnerSessionCookie,
  verifyOwnerSecret,
} from "@/lib/server-auth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  return NextResponse.json({
    authenticated: Boolean(getOwnerSession(request)),
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { secret?: string } | null;
  const secret = body?.secret?.trim();

  if (!secret) {
    return NextResponse.json({ error: "Enter the owner secret to continue." }, { status: 400 });
  }

  if (!verifyOwnerSecret(secret)) {
    return NextResponse.json({ error: "Incorrect owner secret. Please try again." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setOwnerSessionCookie(response);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearOwnerSessionCookie(response);
  return response;
}
