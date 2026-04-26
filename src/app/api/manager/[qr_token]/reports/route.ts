import { getReportsSnapshotByQrToken, saveReportCorrectionServer } from "@/lib/server-db";
import { getManagerSession, isManagerSessionAuthorized } from "@/lib/server-auth";
import { createReportsGetHandler, createReportsPostHandler } from "@/lib/route-workflow-helpers";

export const runtime = "nodejs";

export const GET = createReportsGetHandler({
  getManagerSession,
  isManagerSessionAuthorized,
  getReportsSnapshotByQrToken,
  saveReportCorrectionServer,
});

export const POST = createReportsPostHandler({
  getManagerSession,
  isManagerSessionAuthorized,
  getReportsSnapshotByQrToken,
  saveReportCorrectionServer,
});
