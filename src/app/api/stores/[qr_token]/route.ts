import { getStoreByQrTokenServer, toPublicStore } from "@/lib/server-db";
import { createPublicStoreGetHandler } from "@/lib/route-workflow-helpers";

export const runtime = "nodejs";

export const GET = createPublicStoreGetHandler({
  getStoreByQrTokenServer,
  toPublicStore,
});
