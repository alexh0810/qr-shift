import { NextRequest, NextResponse } from "next/server";

import { getStoreByQrTokenServer, toPublicStore } from "@/lib/server-db";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  { params }: { params: { qr_token: string } },
) {
  const store = await getStoreByQrTokenServer(params.qr_token);
  if (!store) {
    return NextResponse.json({ error: "Store not found." }, { status: 404 });
  }

  return NextResponse.json({
    store: toPublicStore(store),
  });
}
