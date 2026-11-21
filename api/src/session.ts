import type { FastifyInstance } from "fastify";

import { getMemberships, normalizeEmail } from "./db/repo.js";
import { sendError } from "./errors.js";
import { isAuthRejection } from "./identity.js";
import { SESSION_COOKIE, requireSession } from "./roles.js";

const SESSION_MAX_AGE_MS = 5 * 24 * 60 * 60 * 1000;

const cookieOptions = () => ({
  httpOnly: true,
  sameSite: "strict" as const,
  secure: process.env.NODE_ENV === "production",
  path: "/",
});

export function sessionRoutes(app: FastifyInstance) {
  app.post<{ Body: { idToken?: unknown } | null }>("/api/session", async (request, reply) => {
    const idToken = request.body?.idToken;
    if (typeof idToken !== "string" || !idToken) {
      return sendError(reply, 400, "invalid_request", "Sign in to continue.");
    }

    let email: string;
    let cookie: string;
    try {
      const identity = await app.auth.verifyIdToken(idToken);
      if (!identity.emailVerified) {
        return sendError(reply, 403, "email_not_verified", "Verify your email address, then sign in again.");
      }
      email = normalizeEmail(identity.email);
      cookie = await app.auth.createSessionCookie(idToken, SESSION_MAX_AGE_MS);
    } catch (error) {
      if (!isAuthRejection(error)) {
        throw error;
      }
      return sendError(reply, 401, "invalid_token", "Sign-in failed. Try again.");
    }

    reply.setCookie(SESSION_COOKIE, cookie, { ...cookieOptions(), maxAge: SESSION_MAX_AGE_MS / 1000 });
    return { ok: true, email };
  });

  app.delete("/api/session", async (request, reply) => {
    const cookie = request.cookies[SESSION_COOKIE];
    if (cookie) {
      try {
        await app.auth.revokeSession(cookie);
      } catch (error) {
        if (!isAuthRejection(error)) {
          request.log.error(error);
        }
      }
    }
    reply.setCookie(SESSION_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
    return { ok: true };
  });

  app.get("/api/me", { preHandler: requireSession }, async (request) => {
    const email = request.user!.email;
    const memberships = await getMemberships(app.db, email);
    return { email, stores: memberships.map(({ id, name, qr_token, role }) => ({ id, name, qr_token, role })) };
  });
}
