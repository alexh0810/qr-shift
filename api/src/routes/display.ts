import type { FastifyInstance } from "fastify";

import type { Db } from "../db/client.js";
import { getStoreById } from "../db/repo.js";
import { sendError } from "../errors.js";
import { WINDOW_MS, safeEqual, signWindow, windowAt } from "../qr.js";

export function displayRoutes(app: FastifyInstance, { db, now }: { db: Db; now: () => number }) {
  app.get<{ Params: { storeId: string } }>("/api/display/:storeId/qr", async (request, reply) => {
    const key = request.headers["x-display-key"];
    const store = await getStoreById(db, request.params.storeId);
    // One answer for unknown store, printed store and bad key, so the endpoint reveals nothing.
    if (!store || store.qr_mode !== "display" || !store.qr_secret || !store.display_key || typeof key !== "string" || !safeEqual(key, store.display_key)) {
      return sendError(reply, 401, "invalid_display_key", "This display link is no longer valid. Ask the owner for a new one.");
    }
    const nowMs = now();
    const window = windowAt(nowMs);
    reply.header("cache-control", "no-store");
    return {
      store_name: store.name,
      qr_token: store.qr_token,
      window,
      sig: signWindow(store.qr_secret, store.id, window),
      refresh_in_ms: (window + 1) * WINDOW_MS - nowMs,
    };
  });
}
