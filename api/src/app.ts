import { sql } from "drizzle-orm";
import Fastify from "fastify";

import type { Db } from "./db/client.js";

export function buildApp({ db }: { db: Db }) {
  const app = Fastify({ logger: process.env.NODE_ENV === "production" });

  app.get("/api/health", async (_request, reply) => {
    try {
      await db.execute(sql`select 1`);
      return { status: "ok" };
    } catch (error) {
      app.log.error(error);
      return reply.code(503).send({ error: "db_unavailable", message: "Database unavailable." });
    }
  });

  return app;
}
