import { buildApp } from "./app.js";
import { hashPin } from "./auth.js";
import type { Db } from "./db/client.js";
import { employees, storeMembers, stores, timelogs } from "./db/schema.js";
import { createTestDb } from "./db/test-db.js";
import type { AuthVerifier } from "./identity.js";
import { SESSION_COOKIE } from "./roles.js";

process.env.MANAGER_SESSION_SECRET ??= "test-manager-secret";
process.env.OWNER_SETUP_SECRET ??= "test-owner-secret";

export const at = (value: string) => new Date(value);

export async function seededDb(): Promise<Db> {
  const db = await createTestDb();
  await db.insert(stores).values([
    { id: "store-1", name: "Downtown", qr_token: "qr-1", pin_hash: await hashPin("1234"), created_at: at("2026-04-01T00:00:00Z") },
    { id: "store-2", name: "Midtown", qr_token: "qr-2", pin_hash: null, created_at: at("2026-04-10T00:00:00Z") },
  ]);
  await db.insert(employees).values([
    { id: "emp-1", store_id: "store-1", name: "Alex", status: "active", created_at: at("2026-04-01T00:00:00Z") },
    { id: "emp-2", store_id: "store-1", name: "Kim", status: "active", created_at: at("2026-04-01T00:00:00Z") },
    { id: "emp-3", store_id: "store-1", name: "Bea", status: "archived", created_at: at("2026-04-01T00:00:00Z") },
    { id: "emp-9", store_id: "store-2", name: "Sam", status: "active", created_at: at("2026-04-10T00:00:00Z") },
  ]);
  await db.insert(timelogs).values([
    { id: "log-1", employee_id: "emp-1", store_id: "store-1", type: "IN", timestamp: at("2026-04-20T08:00:00Z") },
    { id: "log-2", employee_id: "emp-1", store_id: "store-1", type: "OUT", timestamp: at("2026-04-20T16:00:00Z") },
    { id: "log-3", employee_id: "emp-2", store_id: "store-1", type: "IN", timestamp: at("2026-04-21T08:00:00Z") },
  ]);
  await db.insert(storeMembers).values([
    { store_id: "store-1", email: "alice@example.com", role: "owner" },
    { store_id: "store-2", email: "alice@example.com", role: "owner" },
    { store_id: "store-1", email: "bob@example.com", role: "manager" },
    { store_id: "store-2", email: "carol@example.com", role: "owner" },
  ]);
  return db;
}

// "outage" as an ID token or cookie simulates a Firebase failure that is not an auth rejection.
const rejection = () => Object.assign(new Error("rejected"), { code: "auth/invalid-credential" });

export const revokedSessions: string[] = [];

export const fakeAuth: AuthVerifier = {
  async verifyIdToken(idToken) {
    if (idToken.startsWith("id:")) return { email: idToken.slice(3), emailVerified: true };
    if (idToken.startsWith("unverified:")) return { email: idToken.slice(11), emailVerified: false };
    throw idToken === "outage" ? new Error("network down") : rejection();
  },
  async createSessionCookie(idToken) {
    return `session:${(await fakeAuth.verifyIdToken(idToken)).email}`;
  },
  async verifySessionCookie(cookie) {
    if (cookie.startsWith("session:")) return { email: cookie.slice(8) };
    throw cookie === "outage" ? new Error("network down") : rejection();
  },
  async revokeSession(cookie) {
    await fakeAuth.verifySessionCookie(cookie);
    revokedSessions.push(cookie);
  },
};

export const sessionFor = (email: string) => ({ [SESSION_COOKIE]: `session:${email}` });

export function buildTestApp(db: Db, opts: { now?: () => number } = {}) {
  return buildApp({ db, auth: fakeAuth, now: opts.now });
}
