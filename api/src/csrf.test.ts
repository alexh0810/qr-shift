import assert from "node:assert/strict";
import { test } from "node:test";

import { buildApp } from "./app.js";
import { TEST_ORIGIN, buildTestApp, fakeAuth, seededDb } from "./test-support.js";

const forged = { origin: "https://evil.example" };
const clock = { employeeId: "emp-2", requestedAction: "OUT" };

async function statusOfKim(app: ReturnType<typeof buildTestApp>) {
  const roster = (await app.inject({ method: "GET", url: "/api/stores/qr-1/employees" })).json();
  return roster.employees.find((entry: { employee: { id: string } }) => entry.employee.id === "emp-2").status;
}

test("mutating requests from another origin are rejected, including login", async () => {
  const app = buildTestApp(await seededDb());
  const login = await app.inject({ method: "POST", url: "/api/session", headers: forged, payload: { idToken: "id:alice@example.com" } });
  assert.deepEqual([login.statusCode, login.json()], [
    403,
    { error: "forbidden_origin", message: "Request not allowed from this origin." },
  ]);
  assert.equal(login.cookies.length, 0);

  const post = await app.inject({ method: "POST", url: "/api/stores/qr-1/clock", headers: forged, payload: clock });
  assert.equal(post.statusCode, 403);
  const logout = await app.inject({ method: "DELETE", url: "/api/session", headers: forged });
  assert.equal(logout.statusCode, 403);
  assert.equal(await statusOfKim(app), "IN");
});

test("the configured origin is accepted and GET requests are never origin-checked", async () => {
  const app = buildTestApp(await seededDb());
  const post = await app.inject({ method: "POST", url: "/api/stores/qr-1/clock", payload: clock });
  assert.equal(post.statusCode, 200);

  const read = await app.inject({ method: "GET", url: "/api/stores/qr-1", headers: forged });
  assert.equal(read.statusCode, 200);
  assert.equal(read.headers["access-control-allow-origin"], undefined);
});

test("the deploy smoke probes: forged origin gets 403, allowed origin reaches the route", async () => {
  const app = buildTestApp(await seededDb());
  const url = "/api/stores/zz-nonexistent/clock";
  const forgedProbe = await app.inject({ method: "POST", url, headers: forged, payload: {} });
  const allowedProbe = await app.inject({ method: "POST", url, payload: { employeeId: "x", requestedAction: "IN" } });
  assert.deepEqual([forgedProbe.statusCode, allowedProbe.statusCode], [403, 400]);
});

test("a mutating request without an Origin header is rejected", async () => {
  const app = buildApp({ db: await seededDb(), auth: fakeAuth, appOrigin: TEST_ORIGIN });
  const response = await app.inject({ method: "POST", url: "/api/session", payload: { idToken: "id:alice@example.com" } });
  assert.equal(response.statusCode, 403);
});

for (const type of ["application/x-www-form-urlencoded", "text/plain", "multipart/form-data; boundary=x"]) {
  test(`${type} bodies are rejected with 415 and write nothing`, async () => {
    const app = buildTestApp(await seededDb());
    const response = await app.inject({
      method: "POST",
      url: "/api/stores/qr-1/clock",
      payload: "employeeId=emp-2&requestedAction=OUT",
      headers: { "content-type": type },
    });
    assert.deepEqual([response.statusCode, response.json().error], [415, "unsupported_media_type"]);
    assert.equal(await statusOfKim(app), "IN");
  });
}
