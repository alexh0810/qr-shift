import cookie from "@fastify/cookie";
import { sql } from "drizzle-orm";
import Fastify from "fastify";
import type { FastifyError } from "fastify";

import type { Db } from "./db/client.js";
import { sendError } from "./errors.js";
import type { AuthVerifier } from "./identity.js";
import { displayRoutes } from "./routes/display.js";
import { managerRoutes } from "./routes/manager.js";
import { ownerRoutes } from "./routes/owner.js";
import { publicRoutes } from "./routes/public.js";
import { qrRoutes } from "./routes/qr.js";
import { sessionRoutes } from "./session.js";

export function buildApp({ db, auth, now = Date.now }: { db: Db; auth: AuthVerifier; now?: () => number }) {
  const app = Fastify({ logger: process.env.NODE_ENV === "production" });

  app.decorate("db", db);
  app.decorate("auth", auth);
  app.decorateRequest("user", null);
  app.decorateRequest("store", null);
  app.decorateRequest("role", null);

  app.register(cookie);
  app.setNotFoundHandler((_request, reply) => sendError(reply, 404, "not_found", "Not found."));
  app.setErrorHandler((error: FastifyError, request, reply) => {
    const status = error.statusCode ?? 500;
    if (status >= 500) {
      request.log.error(error);
      return sendError(reply, 500, "internal_error", "Something went wrong. Try again.");
    }
    if (status === 413) {
      return sendError(reply, 413, "payload_too_large", "Request body is too large.");
    }
    if (status === 415) {
      return sendError(reply, 415, "unsupported_media_type", "Send the request body as JSON.");
    }
    return sendError(reply, 400, "invalid_request", "The request could not be processed.");
  });
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

  sessionRoutes(app);
  publicRoutes(app, { db, now });
  managerRoutes(app, { db });
  ownerRoutes(app, { db });
  qrRoutes(app, { db });
  displayRoutes(app, { db, now });

  return app;
}
