import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const WINDOW_MS = 30_000;
export const TICKET_TTL_MS = 120_000;

export type Ticket = { storeId: string; exp: number; mac: string };

export const newSecret = () => randomBytes(32).toString("base64url");

const mac = (secret: string, message: string) => createHmac("sha256", secret).update(message).digest("base64url");

export function safeEqual(a: string, b: string) {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && timingSafeEqual(left, right);
}

export const windowAt = (nowMs: number) => Math.floor(nowMs / WINDOW_MS);

export const signWindow = (secret: string, storeId: string, window: number) => mac(secret, JSON.stringify(["w", storeId, window]));

// Current or previous window only, so a QR is accepted for at most 60 s after it was first shown.
export function verifyWindow(secret: string, storeId: string, window: number, sig: string, nowMs: number) {
  if (!secret || !Number.isInteger(window) || typeof sig !== "string") {
    return false;
  }
  const current = windowAt(nowMs);
  if (window !== current && window !== current - 1) {
    return false;
  }
  return safeEqual(sig, signWindow(secret, storeId, window));
}

// The "w"/"t" tags keep window signatures and ticket MACs from being interchangeable.
export function issueTicket(secret: string, storeId: string, nowMs: number): Ticket {
  const exp = nowMs + TICKET_TTL_MS;
  return { storeId, exp, mac: mac(secret, JSON.stringify(["t", storeId, exp])) };
}

export function verifyTicket(secret: string, storeId: string, ticket: unknown, nowMs: number) {
  if (!secret || !ticket || typeof ticket !== "object") {
    return false;
  }
  const { storeId: ticketStore, exp, mac: given } = ticket as Record<string, unknown>;
  if (ticketStore !== storeId || typeof exp !== "number" || !Number.isInteger(exp) || typeof given !== "string" || !(exp > nowMs)) {
    return false;
  }
  return safeEqual(given, mac(secret, JSON.stringify(["t", storeId, exp])));
}
