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
