import { getDashboardSnapshotByQrToken } from "@/lib/server-db";
import { getManagerSession, isManagerSessionAuthorized } from "@/lib/server-auth";
import { createDashboardGetHandler } from "@/lib/route-workflow-helpers";

export const runtime = "nodejs";

export const GET = createDashboardGetHandler({
  getManagerSession,
  isManagerSessionAuthorized,
  getDashboardSnapshotByQrToken,
});
