import type { FastifyInstance, FastifyReply, FastifyRequest } from "fastify";

import { clearOwnerSessionCookie, getOwnerSession, setOwnerSessionCookie, verifyOwnerSecret } from "../auth.js";
import type { Db } from "../db/client.js";
import {
  createDemoStoreWithTimelogs,
  createEmployeeForStore,
  createStoreAndEmployees,
  getOwnerStoreRoster,
  getOwnerStoreSummaries,
  updateEmployeeForStore,
} from "../db/repo.js";

type StoreParams = { Params: { storeId: string } };
type EmployeeParams = { Params: { storeId: string; employeeId: string } };

const EMPLOYEE_ERRORS: Record<string, string> = {
  store_not_found: "Store not found.",
  employee_not_found: "Employee not found.",
  employee_store_mismatch: "This employee does not belong to the selected store.",
  duplicate_employee_name: "An employee with that name already exists for this store.",
  invalid_employee_name: "Enter an employee name.",
  no_employee_changes: "No employee changes were provided.",
};

function errorCode(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export function ownerRoutes(app: FastifyInstance, { db }: { db: Db }) {
  async function requireOwner(request: FastifyRequest, reply: FastifyReply) {
    if (!getOwnerSession(request)) {
      return reply.code(401).send({ error: "Owner access is required." });
    }
  }

  app.get("/api/admin/session", async (request) => ({ authenticated: Boolean(getOwnerSession(request)) }));

  app.post<{ Body: { secret?: string } | null }>("/api/admin/session", async (request, reply) => {
    const secret = request.body?.secret?.trim();
    if (!secret) {
      return reply.code(400).send({ error: "Enter the owner secret to continue." });
    }
    if (!verifyOwnerSecret(secret)) {
      return reply.code(401).send({ error: "Incorrect owner secret. Please try again." });
    }
    setOwnerSessionCookie(reply);
    return { ok: true };
  });

  app.delete("/api/admin/session", async (_request, reply) => {
    clearOwnerSessionCookie(reply);
    return { ok: true };
  });

  app.get("/api/admin/stores", { preHandler: requireOwner }, async () => ({ stores: await getOwnerStoreSummaries(db) }));

  app.post<{ Body: { storeName?: string; pin?: string; employeeNames?: string[] } | null }>(
    "/api/admin/stores",
    { preHandler: requireOwner },
    async (request, reply) => {
      const storeName = request.body?.storeName?.trim();
      const pin = request.body?.pin?.trim();
      const employeeNames = Array.isArray(request.body?.employeeNames) ? request.body.employeeNames : [];
      if (!storeName || !pin || employeeNames.length === 0) {
        return reply.code(400).send({ error: "Add a store name, manager PIN, and at least one employee." });
      }
      if (!/^\d{1,6}$/.test(pin)) {
        return reply.code(400).send({ error: "Manager PIN must be numeric and 6 digits or fewer." });
      }
      return createStoreAndEmployees(db, storeName, pin, employeeNames);
    },
  );

  app.get<StoreParams>("/api/admin/stores/:storeId/employees", { preHandler: requireOwner }, async (request, reply) => {
    const roster = await getOwnerStoreRoster(db, request.params.storeId);
    if (!roster) {
      return reply.code(404).send({ error: "Store not found." });
    }
    return roster;
  });

  app.post<StoreParams & { Body: { name?: string } | null }>(
    "/api/admin/stores/:storeId/employees",
    { preHandler: requireOwner },
    async (request, reply) => {
      const name = request.body?.name?.trim();
      if (!name) {
        return reply.code(400).send({ error: "Enter an employee name." });
      }
      try {
        return { employee: await createEmployeeForStore(db, request.params.storeId, name) };
      } catch (error) {
        const code = errorCode(error, "employee_create_failed");
        return reply
          .code(code === "store_not_found" ? 404 : 400)
          .send({ error: EMPLOYEE_ERRORS[code] ?? "QRShift couldn't add that employee. Try again." });
      }
    },
  );

  app.patch<EmployeeParams & { Body: { name?: unknown; status?: "active" | "archived" } | null }>(
    "/api/admin/stores/:storeId/employees/:employeeId",
    { preHandler: requireOwner },
    async (request, reply) => {
      try {
        const employee = await updateEmployeeForStore(db, {
          storeId: request.params.storeId,
          employeeId: request.params.employeeId,
          name: typeof request.body?.name === "string" ? request.body.name : undefined,
          status: request.body?.status,
        });
        return { employee };
      } catch (error) {
        const code = errorCode(error, "employee_update_failed");
        return reply
          .code(code === "store_not_found" || code === "employee_not_found" ? 404 : 400)
          .send({ error: EMPLOYEE_ERRORS[code] ?? "QRShift couldn't update that employee. Try again." });
      }
    },
  );

  app.post("/api/admin/demo-store", { preHandler: requireOwner }, async () => createDemoStoreWithTimelogs(db));
}
