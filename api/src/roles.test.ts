import assert from "node:assert/strict";
import { test } from "node:test";

import { requireRole } from "./roles.js";
import { buildTestApp, seededDb, sessionFor } from "./test-support.js";

async function appWithProbes() {
  const app = buildTestApp(await seededDb());
  app.get("/probe/manager/:qr_token", { preHandler: requireRole("manager") }, async (request) => ({ role: request.role, store: request.store?.id }));
  app.get("/probe/owner/:storeId", { preHandler: requireRole("owner") }, async (request) => ({ role: request.role, email: request.user?.email }));
  return app;
}

const status = async (app: Awaited<ReturnType<typeof appWithProbes>>, url: string, email?: string) =>
  (await app.inject({ method: "GET", url, cookies: email ? sessionFor(email) : {} })).statusCode;

test("requireRole answers 401 without a session", async () => {
  const app = await appWithProbes();
  assert.equal(await status(app, "/probe/manager/qr-1"), 401);
  assert.equal(await status(app, "/probe/owner/store-1"), 401);
});

test("a manager passes manager routes and is refused owner routes", async () => {
  const app = await appWithProbes();
  const ok = await app.inject({ method: "GET", url: "/probe/manager/qr-1", cookies: sessionFor("bob@example.com") });
  assert.deepEqual(ok.json(), { role: "manager", store: "store-1" });
  assert.equal(await status(app, "/probe/owner/store-1", "bob@example.com"), 403);
});

test("an owner satisfies manager and owner routes", async () => {
  const app = await appWithProbes();
  assert.equal(await status(app, "/probe/manager/qr-1", "alice@example.com"), 200);
  const ok = await app.inject({ method: "GET", url: "/probe/owner/store-1", cookies: sessionFor("alice@example.com") });
  assert.deepEqual(ok.json(), { role: "owner", email: "alice@example.com" });
});

test("membership of one store grants nothing on another; unknown stores are 403", async () => {
  const app = await appWithProbes();
  assert.equal(await status(app, "/probe/manager/qr-2", "bob@example.com"), 403);
  assert.equal(await status(app, "/probe/owner/store-1", "carol@example.com"), 403);
  assert.equal(await status(app, "/probe/manager/missing", "alice@example.com"), 403);
  assert.equal(await status(app, "/probe/owner/missing", "alice@example.com"), 403);
  const forbidden = await app.inject({ method: "GET", url: "/probe/manager/qr-2", cookies: sessionFor("bob@example.com") });
  assert.deepEqual(forbidden.json(), { error: "forbidden", message: "You don't have access to this store." });
});

test("requireRole answers 500 on a non-auth verifier failure and 401 on an auth rejection", async () => {
  const app = await appWithProbes();
  const outage = await app.inject({ method: "GET", url: "/probe/manager/qr-1", cookies: { __session: "outage" } });
  assert.equal(outage.statusCode, 500);
  const rejected = await app.inject({ method: "GET", url: "/probe/manager/qr-1", cookies: { __session: "tampered" } });
  assert.equal(rejected.statusCode, 401);
});

test("emails are matched case-insensitively", async () => {
  const app = await appWithProbes();
  assert.equal(await status(app, "/probe/manager/qr-1", "BOB@Example.com"), 200);
});
