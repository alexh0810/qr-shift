import { NextRequest, NextResponse } from "next/server";

import {
  clearManagerSessionCookie,
  getManagerSession,
  isManagerSessionAuthorized,
  setManagerSessionCookie,
} from "@/lib/server-auth";
import { getStoreByQrTokenServer } from "@/lib/server-db";
import { verifyPin } from "@/lib/pin-hash";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const qrToken = request.nextUrl.searchParams.get("qr_token");
  const session = getManagerSession(request);

  return NextResponse.json({
    authenticated: qrToken ? isManagerSessionAuthorized(session, qrToken) : Boolean(session),
  });
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => null)) as { qr_token?: string; pin?: string } | null;
  const qrToken = body?.qr_token?.trim();
  const pin = body?.pin?.trim();

  if (!qrToken || !pin) {
    return NextResponse.json({ error: "Enter the manager PIN to continue." }, { status: 400 });
  }

  const store = await getStoreByQrTokenServer(qrToken);
  if (!store || !store.pin_hash) {
    return NextResponse.json(
      { error: "This store is not ready for secure manager access yet." },
      { status: 400 },
    );
  }

  const isValid = await verifyPin(pin, store.pin_hash);
  if (!isValid) {
    return NextResponse.json({ error: "Incorrect PIN. Please try again." }, { status: 401 });
  }

  const response = NextResponse.json({ ok: true });
  setManagerSessionCookie(response, store.id, store.qr_token);
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearManagerSessionCookie(response);
  return response;
}
