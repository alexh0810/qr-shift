import type { FastifyInstance } from "fastify";

import {
  clearManagerSessionCookie,
  getManagerSession,
  isManagerSessionAuthorized,
  setManagerSessionCookie,
  verifyPin,
} from "../auth.js";
import type { Db } from "../db/client.js";
import { getReportsSnapshot, getScanRoster, getStoreByQrToken, saveReportCorrection } from "../db/repo.js";

type QrParams = { Params: { qr_token: string } };
type CorrectionBody = {
  employeeId?: string;
  clockInLogId?: string;
  clockOutLogId?: string | null;
  clockInAt?: string;
  clockOutAt?: string;
} | null;

export function managerRoutes(app: FastifyInstance, { db }: { db: Db }) {
  app.get<{ Querystring: { qr_token?: string } }>("/api/manager/session", async (request) => {
    const session = getManagerSession(request);
    const qrToken = request.query.qr_token;
    return { authenticated: qrToken ? isManagerSessionAuthorized(session, qrToken) : Boolean(session) };
  });

  app.post<{ Body: { qr_token?: string; pin?: string } | null }>("/api/manager/session", async (request, reply) => {
    const qrToken = request.body?.qr_token?.trim();
    const pin = request.body?.pin?.trim();
    if (!qrToken || !pin) {
      return reply.code(400).send({ error: "Enter the manager PIN to continue." });
    }

    const store = await getStoreByQrToken(db, qrToken);
    if (!store || !store.pin_hash) {
      return reply.code(400).send({ error: "This store is not ready for secure manager access yet." });
    }
    if (!(await verifyPin(pin, store.pin_hash))) {
      return reply.code(401).send({ error: "Incorrect PIN. Please try again." });
    }

    setManagerSessionCookie(reply, store.id, store.qr_token);
    return { ok: true };
  });

  app.delete("/api/manager/session", async (_request, reply) => {
    clearManagerSessionCookie(reply);
    return { ok: true };
  });

  app.get<QrParams>("/api/manager/:qr_token/dashboard", async (request, reply) => {
    if (!isManagerSessionAuthorized(getManagerSession(request), request.params.qr_token)) {
      return reply.code(401).send({ error: "Manager access is required." });
    }
    const roster = await getScanRoster(db, request.params.qr_token);
    if (!roster) {
      return reply.code(404).send({ error: "Store not found." });
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

  app.get<QrParams>("/api/manager/:qr_token/reports", async (request, reply) => {
    if (!isManagerSessionAuthorized(getManagerSession(request), request.params.qr_token)) {
      return reply.code(401).send({ error: "Manager access is required." });
    }
    const snapshot = await getReportsSnapshot(db, request.params.qr_token);
    if (!snapshot) {
      return reply.code(404).send({ error: "Store not found." });
    }
    return snapshot;
  });

  app.post<QrParams & { Body: CorrectionBody }>("/api/manager/:qr_token/reports", async (request, reply) => {
    if (!isManagerSessionAuthorized(getManagerSession(request), request.params.qr_token)) {
      return reply.code(401).send({ error: "Manager access is required." });
    }

    const body = request.body;
    const employeeId = body?.employeeId?.trim();
    const clockInLogId = body?.clockInLogId?.trim();
    const clockOutLogId = typeof body?.clockOutLogId === "string" ? body.clockOutLogId.trim() : null;
    const clockInAt = body?.clockInAt ? new Date(body.clockInAt) : null;
    const clockOutAt = body?.clockOutAt ? new Date(body.clockOutAt) : null;

    if (
      !employeeId ||
      !clockInLogId ||
      !clockInAt ||
      Number.isNaN(clockInAt.getTime()) ||
      !clockOutAt ||
      Number.isNaN(clockOutAt.getTime())
    ) {
      return reply.code(400).send({ error: "Invalid report correction." });
    }

    try {
      return await saveReportCorrection(db, {
        qrToken: request.params.qr_token,
        employeeId,
        clockInLogId,
        clockOutLogId,
        clockInAt,
        clockOutAt,
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "report_correction_failed";
      if (message !== "invalid_range" && message !== "future_correction_not_supported") {
        request.log.error({ qrToken: request.params.qr_token, employeeId, clockInLogId, clockOutLogId, message }, "Failed to save report correction");
      }
      return reply.code(400).send({
        error:
          message === "invalid_range"
            ? "Clock-out must be after clock-in."
            : message === "future_correction_not_supported"
              ? "Only completed shifts can be saved right now."
              : "QRShift couldn't save that report correction. Try again.",
      });
    }
  });
}
