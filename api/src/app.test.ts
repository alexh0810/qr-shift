import assert from "node:assert/strict";
import { test } from "node:test";

import { buildApp } from "./app.js";
import type { Db } from "./db/client.js";
import { createTestDb } from "./db/test-db.js";

test("GET /api/health returns ok when the database answers", async () => {
  const app = buildApp({ db: await createTestDb() });
  const response = await app.inject({ method: "GET", url: "/api/health" });

  assert.equal(response.statusCode, 200);
  assert.deepEqual(response.json(), { status: "ok" });
});

test("GET /api/health returns 503 when the database is down", async () => {
  const db = { execute: async () => Promise.reject(new Error("down")) } as unknown as Db;
  const app = buildApp({ db });
  const response = await app.inject({ method: "GET", url: "/api/health" });

  assert.equal(response.statusCode, 503);
  assert.deepEqual(response.json(), { error: "db_unavailable", message: "Database unavailable." });
});

test("unknown routes and unsupported bodies use the { error, message } shape", async () => {
  const app = buildApp({ db: await createTestDb() });

  const missing = await app.inject({ method: "GET", url: "/api/nope" });
  assert.deepEqual([missing.statusCode, missing.json()], [404, { error: "not_found", message: "Not found." }]);

  const text = await app.inject({
    method: "POST",
    url: "/api/stores/qr-1/clock",
    payload: "x",
    headers: { "content-type": "application/xml" },
  });
  assert.deepEqual([text.statusCode, text.json()], [
    415,
    { error: "unsupported_media_type", message: "Send the request body as JSON." },
  ]);
});

test("unexpected errors return a generic 500 without leaking details", async () => {
  const app = buildApp({ db: await createTestDb() });
  app.get("/api/boom", async () => {
    throw new Error("secret detail");
  });
  const response = await app.inject({ method: "GET", url: "/api/boom" });
  assert.deepEqual([response.statusCode, response.json()], [
    500,
    { error: "internal_error", message: "Something went wrong. Try again." },
  ]);
});
