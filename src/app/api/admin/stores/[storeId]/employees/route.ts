import {
  createOwnerStoreRosterGetHandler,
  createOwnerStoreRosterPostHandler,
} from "@/lib/route-workflow-helpers";
import { getOwnerSession } from "@/lib/server-auth";
import { createEmployeeForStoreServer, getOwnerStoreRosterServer, updateEmployeeForStoreServer } from "@/lib/server-db";

export const runtime = "nodejs";

const dependencies = {
  getOwnerSession,
  getOwnerStoreRosterServer,
  createEmployeeForStoreServer,
  updateEmployeeForStoreServer,
};

export const GET = createOwnerStoreRosterGetHandler(dependencies);
export const POST = createOwnerStoreRosterPostHandler(dependencies);
