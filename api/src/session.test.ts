import assert from "node:assert/strict";
import { test } from "node:test";

import { SESSION_COOKIE } from "./roles.js";
import { buildTestApp, revokedSessions, seededDb, sessionFor } from "./test-support.js";

test("POST /api/session exchanges a verified ID token for an HttpOnly Strict cookie", async () => {
  const app = buildTestApp(await seededDb());
  const response = await app.inject({ method: "POST", url: "/api/session", payload: { idToken: "id:alice@example.com" } });
  assert.deepEqual(response.json(), { ok: true, email: "alice@example.com" });
  const cookie = response.cookies.find((entry) => entry.name === SESSION_COOKIE);
  assert.equal(cookie?.value, "session:alice@example.com");
  assert.equal(cookie?.httpOnly, true);
  assert.equal(cookie?.sameSite, "Strict");
  assert.equal(cookie?.path, "/");
  assert.equal(cookie?.maxAge, 5 * 24 * 60 * 60);
});

test("POST /api/session rejects missing, invalid and unverified tokens", async () => {
  const app = buildTestApp(await seededDb());
  const missing = await app.inject({ method: "POST", url: "/api/session", payload: {} });
  assert.deepEqual([missing.statusCode, missing.json().error], [400, "invalid_request"]);

  const invalid = await app.inject({ method: "POST", url: "/api/session", payload: { idToken: "garbage" } });
  assert.deepEqual([invalid.statusCode, invalid.json().error], [401, "invalid_token"]);

  const unverified = await app.inject({ method: "POST", url: "/api/session", payload: { idToken: "unverified:alice@example.com" } });
  assert.deepEqual([unverified.statusCode, unverified.json()], [
    403,
    { error: "email_not_verified", message: "Verify your email address, then sign in again." },
  ]);
  assert.equal(unverified.cookies.length, 0);
});

test("DELETE /api/session revokes the session and clears the cookie with the same attributes", async () => {
  const app = buildTestApp(await seededDb());
  const response = await app.inject({ method: "DELETE", url: "/api/session", cookies: sessionFor("alice@example.com") });
  assert.deepEqual(response.json(), { ok: true });
  assert.ok(revokedSessions.includes("session:alice@example.com"));
  const cookie = response.cookies.find((entry) => entry.name === SESSION_COOKIE);
  assert.deepEqual(
    [cookie?.value, cookie?.maxAge, cookie?.path, cookie?.sameSite, cookie?.httpOnly],
    ["", 0, "/", "Strict", true],
  );
});

test("DELETE /api/session clears the cookie even when the session cannot be revoked", async () => {
  const app = buildTestApp(await seededDb());
  for (const value of ["tampered", "outage"]) {
    const response = await app.inject({ method: "DELETE", url: "/api/session", cookies: { [SESSION_COOKIE]: value } });
    assert.equal(response.statusCode, 200);
    assert.equal(response.cookies.find((entry) => entry.name === SESSION_COOKIE)?.maxAge, 0);
  }
  assert.ok(!revokedSessions.includes("tampered"));
});

test("session cookies are Secure in production", async () => {
  const previous = process.env.NODE_ENV;
  process.env.NODE_ENV = "production";
  try {
    const app = buildTestApp(await seededDb());
    const set = await app.inject({ method: "POST", url: "/api/session", payload: { idToken: "id:alice@example.com" } });
    const clear = await app.inject({ method: "DELETE", url: "/api/session" });
    for (const response of [set, clear]) {
      assert.equal(response.cookies.find((entry) => entry.name === SESSION_COOKIE)?.secure, true);
    }
  } finally {
    process.env.NODE_ENV = previous;
  }
});

test("an auth outage is a 500, never a 401", async () => {
  const app = buildTestApp(await seededDb());
  const login = await app.inject({ method: "POST", url: "/api/session", payload: { idToken: "outage" } });
  assert.deepEqual([login.statusCode, login.json().error], [500, "internal_error"]);

  const me = await app.inject({ method: "GET", url: "/api/me", cookies: { [SESSION_COOKIE]: "outage" } });
  assert.deepEqual([me.statusCode, me.json().error], [500, "internal_error"]);
});

test("GET /api/me lists the user's stores with roles", async () => {
  const app = buildTestApp(await seededDb());
  const body = (await app.inject({ method: "GET", url: "/api/me", cookies: sessionFor("bob@example.com") })).json();
  assert.deepEqual(body, { email: "bob@example.com", stores: [{ id: "store-1", name: "Downtown", qr_token: "qr-1", role: "manager" }] });

  const none = (await app.inject({ method: "GET", url: "/api/me", cookies: sessionFor("dave@example.com") })).json();
  assert.deepEqual(none, { email: "dave@example.com", stores: [] });
});

test("GET /api/me requires a valid session", async () => {
  const app = buildTestApp(await seededDb());
  for (const cookies of [{}, { [SESSION_COOKIE]: "tampered" }] as Record<string, string>[]) {
    const response = await app.inject({ method: "GET", url: "/api/me", cookies });
    assert.deepEqual([response.statusCode, response.json()], [401, { error: "unauthenticated", message: "Sign in to continue." }]);
  }
});
