import type { FastifyInstance } from "fastify";

import type { Db } from "../db/client.js";
import { getReportsSnapshot, getScanRoster, saveReportCorrection } from "../db/repo.js";
import { sendError } from "../errors.js";
import { requireRole } from "../roles.js";

type QrParams = { Params: { qr_token: string } };
type CorrectionBody = {
  employeeId?: string;
  clockInLogId?: string;
  clockOutLogId?: string | null;
  clockInAt?: string;
  clockOutAt?: string;
  reason?: unknown;
} | null;

const REASON_MIN = 3;
const REASON_MAX = 500;

const CORRECTION_ERRORS: Record<string, string> = {
  invalid_range: "Clock-out must be after clock-in.",
  future_correction_not_supported: "Only completed shifts can be saved right now.",
};

export function managerRoutes(app: FastifyInstance, { db }: { db: Db }) {
  app.get<QrParams>("/api/manager/:qr_token/dashboard", { preHandler: requireRole("manager") }, async (request, reply) => {
    const roster = await getScanRoster(db, request.params.qr_token);
    if (!roster) {
      return sendError(reply, 404, "store_not_found", "Store not found.");
    }
    return {
      store: roster.store,
      employees: roster.employees.map((entry) => ({
        employee: entry.employee,
        latest_log: entry.latestLog,
        status: entry.status,
      })),
    };
  });

  app.get<QrParams>("/api/manager/:qr_token/reports", { preHandler: requireRole("manager") }, async (request, reply) => {
    const snapshot = await getReportsSnapshot(db, request.params.qr_token);
    if (!snapshot) {
      return sendError(reply, 404, "store_not_found", "Store not found.");
    }
    return snapshot;
  });

  app.post<QrParams & { Body: CorrectionBody }>("/api/manager/:qr_token/reports", { preHandler: requireRole("manager") }, async (request, reply) => {
    const body = request.body;
    const employeeId = body?.employeeId?.trim();
    const clockInLogId = body?.clockInLogId?.trim();
    const clockOutLogId = typeof body?.clockOutLogId === "string" ? body.clockOutLogId.trim() : null;
    const clockInAt = body?.clockInAt ? new Date(body.clockInAt) : null;
    const clockOutAt = body?.clockOutAt ? new Date(body.clockOutAt) : null;
    const reason = typeof body?.reason === "string" ? body.reason.trim() : "";
    const reasonLength = [...reason].length;

    if (
      !employeeId ||
      !clockInLogId ||
      !clockInAt ||
      Number.isNaN(clockInAt.getTime()) ||
      !clockOutAt ||
      Number.isNaN(clockOutAt.getTime())
    ) {
      return sendError(reply, 400, "invalid_request", "Invalid report correction.");
    }

    if (reasonLength < REASON_MIN) {
      return sendError(reply, 400, "reason_required", "Add a reason of at least 3 characters.");
    }
    if (reasonLength > REASON_MAX) {
      return sendError(reply, 400, "reason_too_long", "Reason must be 500 characters or fewer.");
    }

    try {
      return await saveReportCorrection(db, {
        qrToken: request.params.qr_token,
        employeeId,
        clockInLogId,
        clockOutLogId,
        clockInAt,
        clockOutAt,
        reason,
        changedBy: request.user!.email,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "report_correction_failed";
      if (Object.hasOwn(CORRECTION_ERRORS, message)) {
        return sendError(reply, 400, message, CORRECTION_ERRORS[message]);
      }
      request.log.error({ qrToken: request.params.qr_token, employeeId, clockInLogId, clockOutLogId, message }, "Failed to save report correction");
      return sendError(reply, 400, "report_correction_failed", "QRShift couldn't save that report correction. Try again.");
    }
  });
}
