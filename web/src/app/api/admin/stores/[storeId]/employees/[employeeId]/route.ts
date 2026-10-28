import { createOwnerStoreEmployeePatchHandler } from "@/lib/route-workflow-helpers";
import { getOwnerSession } from "@/lib/server-auth";
import { createEmployeeForStoreServer, getOwnerStoreRosterServer, updateEmployeeForStoreServer } from "@/lib/server-db";

export const runtime = "nodejs";

export const PATCH = createOwnerStoreEmployeePatchHandler({
  getOwnerSession,
  getOwnerStoreRosterServer,
  createEmployeeForStoreServer,
  updateEmployeeForStoreServer,
});
