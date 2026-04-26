import { getScanRosterByQrToken } from "@/lib/server-db";
import { createScanRosterGetHandler } from "@/lib/route-workflow-helpers";

export const runtime = "nodejs";

export const GET = createScanRosterGetHandler({
  getScanRosterByQrToken,
});
