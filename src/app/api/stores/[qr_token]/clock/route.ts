import { createClockAction } from "@/lib/server-db";
import { createClockPostHandler } from "@/lib/route-workflow-helpers";

export const runtime = "nodejs";

export const POST = createClockPostHandler({ createClockAction });
