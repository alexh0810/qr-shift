import assert from "node:assert/strict";
import { test } from "node:test";

import {
  TICKET_TTL_MS,
  WINDOW_MS,
  issueTicket,
  newSecret,
  safeEqual,
  signWindow,
  verifyTicket,
  verifyWindow,
  windowAt,
} from "./qr.js";

const SECRET = "secret-a";
const T0 = 100 * WINDOW_MS;

test("current and previous window verify; two windows old does not", () => {
  const sig = signWindow(SECRET, "store-1", 100);
  assert.equal(verifyWindow(SECRET, "store-1", 100, sig, T0), true);
  assert.equal(verifyWindow(SECRET, "store-1", 100, sig, T0 + WINDOW_MS), true);
  assert.equal(verifyWindow(SECRET, "store-1", 100, sig, T0 + 2 * WINDOW_MS - 1), true);
  assert.equal(verifyWindow(SECRET, "store-1", 100, sig, T0 + 2 * WINDOW_MS), false);
});

test("a future window is rejected", () => {
  const sig = signWindow(SECRET, "store-1", 101);
  assert.equal(verifyWindow(SECRET, "store-1", 101, sig, T0), false);
});

test("tampered signature, wrong store, wrong secret and empty secret are rejected", () => {
  const sig = signWindow(SECRET, "store-1", 100);
  assert.equal(verifyWindow(SECRET, "store-1", 100, sig.slice(0, -1) + (sig.endsWith("A") ? "B" : "A"), T0), false);
  assert.equal(verifyWindow(SECRET, "store-2", 100, sig, T0), false);
  assert.equal(verifyWindow("secret-b", "store-1", 100, sig, T0), false);
  assert.equal(verifyWindow("", "store-1", 100, signWindow("", "store-1", 100), T0), false);
});

test("non-integer windows are rejected", () => {
  const sig = signWindow(SECRET, "store-1", 100);
  assert.equal(verifyWindow(SECRET, "store-1", 100.5, sig, T0), false);
  assert.equal(verifyWindow(SECRET, "store-1", Number.NaN, sig, T0), false);
});

test("tickets expire after the TTL and are bound to store and secret", () => {
  const ticket = issueTicket(SECRET, "store-1", T0);
  assert.equal(ticket.exp, T0 + TICKET_TTL_MS);
  assert.equal(verifyTicket(SECRET, "store-1", ticket, T0 + TICKET_TTL_MS - 1), true);
  assert.equal(verifyTicket(SECRET, "store-1", ticket, T0 + TICKET_TTL_MS), false);
  assert.equal(verifyTicket(SECRET, "store-2", ticket, T0), false);
  assert.equal(verifyTicket("secret-b", "store-1", ticket, T0), false);
  assert.equal(verifyTicket("", "store-1", issueTicket("", "store-1", T0), T0), false);
});

test("tampered or malformed tickets are rejected", () => {
  const ticket = issueTicket(SECRET, "store-1", T0);
  assert.equal(verifyTicket(SECRET, "store-1", { ...ticket, exp: ticket.exp + 1 }, T0), false);
  assert.equal(verifyTicket(SECRET, "store-1", { ...ticket, storeId: "store-2" }, T0), false);
  assert.equal(verifyTicket(SECRET, "store-1", { ...ticket, mac: "x" }, T0), false);
  for (const bad of [null, undefined, "ticket", 5, {}, { storeId: "store-1", exp: "1", mac: "m" }]) {
    assert.equal(verifyTicket(SECRET, "store-1", bad, T0), false);
  }
});

test("a window signature is not a valid ticket MAC", () => {
  const sig = signWindow(SECRET, "store-1", 100);
  assert.equal(verifyTicket(SECRET, "store-1", { storeId: "store-1", exp: 100, mac: sig }, 0), false);
});

test("safeEqual and helpers", () => {
  assert.equal(safeEqual("abc", "abc"), true);
  assert.equal(safeEqual("abc", "abd"), false);
  assert.equal(safeEqual("abc", "abcd"), false);
  assert.equal(windowAt(T0 + 29_999), 100);
  assert.equal(windowAt(T0 + 30_000), 101);
  assert.notEqual(newSecret(), newSecret());
  assert.ok(newSecret().length >= 43);
});

test("ticket MACs and window signatures are not interchangeable", () => {
  const ticket = issueTicket(SECRET, "store-1", T0);
  assert.equal(verifyWindow(SECRET, "store-1", 100, ticket.mac, T0), false);
  const tricky = "ticket:a:1000";
  const sig = signWindow(SECRET, tricky, 100);
  assert.equal(verifyTicket(SECRET, tricky, { storeId: tricky, exp: 1000, mac: sig }, 0), false);
});

test("non-integer, non-finite and NaN inputs fail closed", () => {
  for (const exp of [Number.NaN, Number.POSITIVE_INFINITY, T0 + 0.5]) {
    const forged = { storeId: "store-1", exp, mac: issueTicket(SECRET, "store-1", T0).mac };
    assert.equal(verifyTicket(SECRET, "store-1", forged, T0), false);
  }
  const ticket = issueTicket(SECRET, "store-1", T0);
  assert.equal(verifyTicket(SECRET, "store-1", ticket, Number.NaN), false);
  assert.equal(verifyWindow(SECRET, "store-1", -1, signWindow(SECRET, "store-1", -1), T0), false);
});

test("store ids containing separators round-trip", () => {
  const id = "a.b:c";
  assert.equal(verifyWindow(SECRET, id, 100, signWindow(SECRET, id, 100), T0), true);
  assert.equal(verifyTicket(SECRET, id, issueTicket(SECRET, id, T0), T0), true);
});

test("non-string signatures return false without throwing", () => {
  for (const sig of [undefined, ["x"], 5]) {
    assert.equal(verifyWindow(SECRET, "store-1", 100, sig as unknown as string, T0), false);
  }
});
