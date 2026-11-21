import { sql } from "drizzle-orm";
import type { FastifyInstance } from "fastify";

import type { Db } from "../db/client.js";
import { stores } from "../db/schema.js";
import { toQrSettings, updateStoreQr } from "../db/repo.js";
import { sendError } from "../errors.js";
import { newSecret } from "../qr.js";
import { requireRole } from "../roles.js";

type StoreParams = { Params: { storeId: string } };

const isNumberIn = (value: unknown, limit: number): value is number =>
  typeof value === "number" && Number.isFinite(value) && Math.abs(value) <= limit;

export function qrRoutes(app: FastifyInstance, { db }: { db: Db }) {
  const owner = {
    preHandler: requireRole("owner"),
    onSend: async (_request: unknown, reply: { header: (name: string, value: string) => unknown }, payload: unknown) => {
      reply.header("cache-control", "no-store");
      return payload;
    },
  };

  app.get<StoreParams>("/api/admin/stores/:storeId/qr-settings", owner, async (request) => toQrSettings(request.store!));

  app.put<StoreParams & { Body: { qr_mode?: unknown } | null }>("/api/admin/stores/:storeId/qr-mode", owner, async (request, reply) => {
    const mode = request.body?.qr_mode;
    if (mode !== "display" && mode !== "printed") {
      return sendError(reply, 400, "invalid_qr_mode", "Choose display or printed.");
    }
    const patch: Parameters<typeof updateStoreQr>[2] =
      mode === "display"
        ? { qr_mode: mode, qr_secret: sql`coalesce(${stores.qr_secret}, ${newSecret()})`, display_key: sql`coalesce(${stores.display_key}, ${newSecret()})` }
        : { qr_mode: mode, display_key: null };
    return toQrSettings(await updateStoreQr(db, request.store!.id, patch));
  });

  app.put<StoreParams & { Body: { lat?: unknown; lng?: unknown; radius_m?: unknown } | null }>(
    "/api/admin/stores/:storeId/location",
    owner,
    async (request, reply) => {
      const { lat, lng, radius_m } = request.body ?? {};
      const clear = lat === null && lng === null;
      const radiusOk = radius_m === undefined || (typeof radius_m === "number" && Number.isInteger(radius_m) && radius_m >= 25 && radius_m <= 1000);
      if (!radiusOk || !(clear || (isNumberIn(lat, 90) && isNumberIn(lng, 180)))) {
        return sendError(reply, 400, "invalid_location", "Enter a valid location and a radius between 25 and 1000 m.");
      }
      const updated = await updateStoreQr(db, request.store!.id, {
        lat: clear ? null : (lat as number),
        lng: clear ? null : (lng as number),
        ...(radius_m === undefined ? {} : { radius_m }),
      });
      return toQrSettings(updated);
    },
  );

  app.post<StoreParams>("/api/admin/stores/:storeId/qr/reissue", owner, async (request, reply) => {
    if (request.store!.qr_mode !== "display") {
      return sendError(reply, 400, "not_display_mode", "Switch the store to display mode first.");
    }
    await updateStoreQr(db, request.store!.id, { qr_secret: newSecret() });
    return { ok: true };
  });

  app.post<StoreParams>("/api/admin/stores/:storeId/display-key/reset", owner, async (request, reply) => {
    const store = request.store!;
    if (store.qr_mode !== "display") {
      return sendError(reply, 400, "not_display_mode", "Switch the store to display mode first.");
    }
    return toQrSettings(await updateStoreQr(db, store.id, { display_key: newSecret() }));
  });
}
