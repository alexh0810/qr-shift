import type { FastifyInstance, FastifyReply } from "fastify";

import type { Db } from "../db/client.js";
import {
  addManager,
  createDemoStoreWithTimelogs,
  createEmployeeForStore,
  createStoreAndEmployees,
  getOwnerStoreRoster,
  getOwnerStoreSummaries,
  listMembers,
  removeManager,
  updateEmployeeForStore,
} from "../db/repo.js";
import { sendError } from "../errors.js";
import { requireRole, requireSession } from "../roles.js";

type StoreParams = { Params: { storeId: string } };
type EmployeeParams = { Params: { storeId: string; employeeId: string } };
type MemberParams = { Params: { storeId: string; email: string } };

const EMPLOYEE_ERRORS: Record<string, string> = {
  store_not_found: "Store not found.",
  employee_not_found: "Employee not found.",
  employee_store_mismatch: "This employee does not belong to the selected store.",
  duplicate_employee_name: "An employee with that name already exists for this store.",
  invalid_employee_name: "Enter an employee name.",
  no_employee_changes: "No employee changes were provided.",
};

const MEMBER_ERRORS: Record<string, string> = {
  invalid_email: "Enter a valid email address.",
  already_member: "That person already has access to this store.",
  cannot_remove_owner: "Owners can't be removed.",
  member_not_found: "No manager with that email.",
};

function errorCode(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

function sendEmployeeError(reply: FastifyReply, error: unknown, fallbackCode: string, fallbackMessage: string) {
  const code = errorCode(error, fallbackCode);
  if (!Object.hasOwn(EMPLOYEE_ERRORS, code)) {
    return sendError(reply, 400, fallbackCode, fallbackMessage);
  }
  return sendError(reply, code === "store_not_found" || code === "employee_not_found" ? 404 : 400, code, EMPLOYEE_ERRORS[code]);
}

function sendMemberError(reply: FastifyReply, error: unknown, fallbackCode: string, fallbackMessage: string) {
  const code = errorCode(error, fallbackCode);
  if (!Object.hasOwn(MEMBER_ERRORS, code)) {
    return sendError(reply, 400, fallbackCode, fallbackMessage);
  }
  return sendError(reply, code === "member_not_found" ? 404 : 400, code, MEMBER_ERRORS[code]);
}

export function ownerRoutes(app: FastifyInstance, { db }: { db: Db }) {
  const owner = { preHandler: requireRole("owner") };

  app.get("/api/admin/stores", { preHandler: requireSession }, async (request) => ({
    stores: await getOwnerStoreSummaries(db, request.user!.email),
  }));

  app.post<{ Body: { storeName?: string; employeeNames?: string[] } | null }>(
    "/api/admin/stores",
    { preHandler: requireSession },
    async (request, reply) => {
      const storeName = request.body?.storeName?.trim();
      const employeeNames = Array.isArray(request.body?.employeeNames) ? request.body.employeeNames : [];
      if (!storeName || employeeNames.length === 0) {
        return sendError(reply, 400, "invalid_request", "Add a store name and at least one employee.");
      }
      return createStoreAndEmployees(db, storeName, request.user!.email, employeeNames);
    },
  );

  app.get<StoreParams>("/api/admin/stores/:storeId/employees", owner, async (request, reply) => {
    const roster = await getOwnerStoreRoster(db, request.params.storeId);
    if (!roster) {
      return sendError(reply, 404, "store_not_found", "Store not found.");
    }
    return roster;
  });

  app.post<StoreParams & { Body: { name?: string } | null }>(
    "/api/admin/stores/:storeId/employees",
    owner,
    async (request, reply) => {
      const name = request.body?.name?.trim();
      if (!name) {
        return sendError(reply, 400, "invalid_employee_name", "Enter an employee name.");
      }
      try {
        return { employee: await createEmployeeForStore(db, request.params.storeId, name) };
      } catch (error) {
        return sendEmployeeError(reply, error, "employee_create_failed", "QRShift couldn't add that employee. Try again.");
      }
    },
  );

  app.patch<EmployeeParams & { Body: { name?: unknown; status?: "active" | "archived" } | null }>(
    "/api/admin/stores/:storeId/employees/:employeeId",
    owner,
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
        return sendEmployeeError(reply, error, "employee_update_failed", "QRShift couldn't update that employee. Try again.");
      }
    },
  );

  app.get<StoreParams>("/api/admin/stores/:storeId/members", owner, async (request) => ({
    members: await listMembers(db, request.params.storeId),
  }));

  app.post<StoreParams & { Body: { email?: unknown } | null }>("/api/admin/stores/:storeId/members", owner, async (request, reply) => {
    const email = typeof request.body?.email === "string" ? request.body.email : "";
    try {
      return { member: await addManager(db, request.params.storeId, email) };
    } catch (error) {
      return sendMemberError(reply, error, "member_add_failed", "QRShift couldn't add that manager. Try again.");
    }
  });

  app.delete<MemberParams>("/api/admin/stores/:storeId/members/:email", owner, async (request, reply) => {
    try {
      await removeManager(db, request.params.storeId, request.params.email);
      return { ok: true };
    } catch (error) {
      return sendMemberError(reply, error, "member_remove_failed", "QRShift couldn't remove that manager. Try again.");
    }
  });

  app.post("/api/admin/demo-store", { preHandler: requireSession }, async (request) =>
    createDemoStoreWithTimelogs(db, request.user!.email),
  );
}
