import type { FastifyInstance } from "fastify";

import type { Db } from "../db/client.js";
import { createClockAction, getScanRoster, getStoreByQrToken, toPublicStore } from "../db/repo.js";
import { sendError } from "../errors.js";

type QrParams = { Params: { qr_token: string } };

export function publicRoutes(app: FastifyInstance, { db }: { db: Db }) {
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
