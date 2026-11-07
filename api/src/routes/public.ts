import type { FastifyInstance } from "fastify";

import type { Db } from "../db/client.js";
import { createClockAction, getScanRoster, getStoreByQrToken, toPublicStore } from "../db/repo.js";

type QrParams = { Params: { qr_token: string } };

export function publicRoutes(app: FastifyInstance, { db }: { db: Db }) {
  app.get<QrParams>("/api/stores/:qr_token", async (request, reply) => {
    const store = await getStoreByQrToken(db, request.params.qr_token);
    if (!store) {
      return reply.code(404).send({ error: "Store not found." });
    }
    return { store: toPublicStore(store) };
  });

  app.get<QrParams>("/api/stores/:qr_token/employees", async (request, reply) => {
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

  app.post<QrParams & { Body: { employeeId?: string; requestedAction?: string } | null }>(
    "/api/stores/:qr_token/clock",
    async (request, reply) => {
      const employeeId = request.body?.employeeId?.trim();
      const requestedAction = request.body?.requestedAction;
      if (!employeeId || (requestedAction !== "IN" && requestedAction !== "OUT")) {
        return reply.code(400).send({ error: "Choose an employee and confirm the next action." });
      }

      try {
        const result = await createClockAction(db, request.params.qr_token, employeeId, requestedAction);
        return { action: result.action, timestamp: result.timestamp };
      } catch (error) {
        const message = error instanceof Error ? error.message : "clock_failed";
        return reply.code(400).send({
          error:
            message === "invalid_transition"
              ? "This shift status changed. Go back and try again."
              : "QRShift couldn't save that clock action. Try again.",
        });
      }
    },
  );
}
