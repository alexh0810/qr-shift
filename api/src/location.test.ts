import assert from "node:assert/strict";
import { test } from "node:test";

import { classifyLocation, haversineMeters } from "./location.js";

const store = { lat: 60.1699, lng: 24.9384, radius_m: 150 };
const north = (meters: number) => store.lat + meters / 111_195;

test("haversine matches known distances", () => {
  assert.equal(haversineMeters({ lat: 1, lng: 2 }, { lat: 1, lng: 2 }), 0);
  assert.ok(Math.abs(haversineMeters({ lat: 0, lng: 0 }, { lat: 1, lng: 0 }) - 111_195) < 10);
  assert.ok(Math.abs(haversineMeters(store, { lat: store.lat, lng: store.lng + 0.01 }) - 553) < 6);
});

test("inside within the radius", () => {
  assert.equal(classifyLocation(store, { lat: north(100), lng: store.lng, accuracy: 10 }), "inside");
});

test("outside beyond radius plus tolerance", () => {
  assert.equal(classifyLocation(store, { lat: north(334), lng: store.lng, accuracy: 20 }), "outside");
});

test("accuracy widens the radius, capped at 100 m", () => {
  assert.equal(classifyLocation(store, { lat: north(240), lng: store.lng, accuracy: 100 }), "inside");
  assert.equal(classifyLocation(store, { lat: north(278), lng: store.lng, accuracy: 200 }), "outside");
});

test("accuracy above 200 m is unknown", () => {
  assert.equal(classifyLocation(store, { lat: north(10), lng: store.lng, accuracy: 201 }), "unknown");
});

test("missing or malformed input is unknown, never an error", () => {
  for (const input of [undefined, null, {}, "x", { lat: 1, lng: 2 }, { lat: 91, lng: 0, accuracy: 5 }, { lat: 0, lng: 181, accuracy: 5 }, { lat: Number.NaN, lng: 0, accuracy: 5 }, { lat: 1, lng: 2, accuracy: -1 }]) {
    assert.equal(classifyLocation(store, input), "unknown", JSON.stringify(input));
  }
});

test("a store without coordinates is not judged", () => {
  assert.equal(classifyLocation({ lat: null, lng: null, radius_m: 150 }, { lat: 1, lng: 2, accuracy: 5 }), null);
});
