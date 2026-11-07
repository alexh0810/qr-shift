import cookie from "@fastify/cookie";
import { sql } from "drizzle-orm";
import Fastify from "fastify";

import type { Db } from "./db/client.js";
import { managerRoutes } from "./routes/manager.js";
import { publicRoutes } from "./routes/public.js";

export function buildApp({ db }: { db: Db }) {
  const app = Fastify({ logger: process.env.NODE_ENV === "production" });

  app.register(cookie);
  // Matches the legacy handlers' `request.json().catch(() => null)`: empty or malformed JSON reaches routes as null.
  app.removeContentTypeParser("application/json");
  app.addContentTypeParser("application/json", { parseAs: "string" }, (_request, body, done) => {
    try {
      done(null, body ? JSON.parse(body as string) : null);
    } catch {
      done(null, null);
    }
  });

  app.get("/api/health", async (_request, reply) => {
    try {
      await db.execute(sql`select 1`);
      return { status: "ok" };
    } catch (error) {
      app.log.error(error);
      return reply.code(503).send({ error: "db_unavailable", message: "Database unavailable." });
    }
  });

  publicRoutes(app, { db });
  managerRoutes(app, { db });

  return app;
}
