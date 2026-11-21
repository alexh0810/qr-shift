import type { FastifyInstance } from "fastify";

import type { Db } from "../db/client.js";
import { createClockAction, getScanRoster, getStoreByQrToken, toPublicStore } from "../db/repo.js";
import { sendError } from "../errors.js";
import { issueTicket, verifyWindow } from "../qr.js";

type QrParams = { Params: { qr_token: string } };

export function publicRoutes(app: FastifyInstance, { db, now }: { db: Db; now: () => number }) {
  app.get<QrParams>("/api/stores/:qr_token", async (request, reply) => {
    const store = await getStoreByQrToken(db, request.params.qr_token);
    if (!store) {
      return sendError(reply, 404, "store_not_found", "Store not found.");
    }
    return { store: toPublicStore(store) };
  });

  app.get<QrParams>("/api/stores/:qr_token/employees", async (request, reply) => {
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

  app.get<QrParams & { Querystring: { w?: unknown; sig?: unknown } }>("/api/stores/:qr_token/scan-ticket", async (request, reply) => {
    const store = await getStoreByQrToken(db, request.params.qr_token);
    if (!store) {
      return sendError(reply, 404, "store_not_found", "Store not found.");
    }
    if (store.qr_mode !== "display" || !store.qr_secret) {
      return sendError(reply, 400, "not_display_mode", "This store does not use a display QR.");
    }
    const { w, sig } = request.query;
    const nowMs = now();
    if (typeof w !== "string" || !/^\d+$/.test(w) || typeof sig !== "string" || !verifyWindow(store.qr_secret, store.id, Number(w), sig, nowMs)) {
      return sendError(reply, 403, "qr_expired", "This QR code expired. Scan the code on the display again.");
    }
    return { ticket: issueTicket(store.qr_secret, store.id, nowMs) };
  });

  app.post<QrParams & { Body: { employeeId?: string; requestedAction?: string } | null }>(
    "/api/stores/:qr_token/clock",
    async (request, reply) => {
      const employeeId = request.body?.employeeId?.trim();
      const requestedAction = request.body?.requestedAction;
      if (!employeeId || (requestedAction !== "IN" && requestedAction !== "OUT")) {
        return sendError(reply, 400, "invalid_request", "Choose an employee and confirm the next action.");
      }

      try {
        const result = await createClockAction(db, request.params.qr_token, employeeId, requestedAction);
        return { action: result.action, timestamp: result.timestamp };
      } catch (error) {
        const message = error instanceof Error ? error.message : "clock_failed";
        return message === "invalid_transition"
          ? sendError(reply, 400, "invalid_transition", "This shift status changed. Go back and try again.")
          : sendError(reply, 400, "clock_failed", "QRShift couldn't save that clock action. Try again.");
      }
    },
  );
}
