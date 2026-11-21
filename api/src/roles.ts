import type { FastifyReply, FastifyRequest } from "fastify";

import type { Db } from "./db/client.js";
import { getMemberRole, getStoreById, getStoreByQrToken, normalizeEmail } from "./db/repo.js";
import type { Store } from "./db/repo.js";
import { sendError } from "./errors.js";
import type { AuthVerifier } from "./identity.js";

export type Role = "manager" | "owner";
export const SESSION_COOKIE = "__session";

declare module "fastify" {
  interface FastifyInstance {
    db: Db;
    auth: AuthVerifier;
  }
  interface FastifyRequest {
    user: { email: string } | null;
    store: Store | null;
    role: Role | null;
  }
}

const RANK: Record<Role, number> = { manager: 1, owner: 2 };

async function readSession(request: FastifyRequest) {
  const cookie = request.cookies[SESSION_COOKIE];
  if (!cookie) {
    return null;
  }
  try {
    const { email } = await request.server.auth.verifySessionCookie(cookie);
    return { email: normalizeEmail(email) };
  } catch {
    return null;
  }
}

export async function requireSession(request: FastifyRequest, reply: FastifyReply) {
  const user = await readSession(request);
  if (!user) {
    return sendError(reply, 401, "unauthenticated", "Sign in to continue.");
  }
  request.user = user;
}

export function requireRole(role: Role) {
  return async (request: FastifyRequest, reply: FastifyReply) => {
    const user = await readSession(request);
    if (!user) {
      return sendError(reply, 401, "unauthenticated", "Sign in to continue.");
    }

    const { db } = request.server;
    const params = request.params as { qr_token?: string; storeId?: string };
    const store = params.storeId
      ? await getStoreById(db, params.storeId)
      : params.qr_token
        ? await getStoreByQrToken(db, params.qr_token)
        : null;
    const memberRole = store ? await getMemberRole(db, store.id, user.email) : null;
    if (!store || !memberRole || RANK[memberRole] < RANK[role]) {
      return sendError(reply, 403, "forbidden", "You don't have access to this store.");
    }

    request.user = user;
    request.store = store;
    request.role = memberRole;
  };
}
