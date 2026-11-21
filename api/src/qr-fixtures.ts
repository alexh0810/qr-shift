import { eq } from "drizzle-orm";

import type { Db } from "./db/client.js";
import { stores } from "./db/schema.js";
import { seededDb } from "./test-support.js";

export const SECRET = "test-qr-secret";
export const DISPLAY_KEY = "test-display-key";

// store-1 runs in display mode; store-2 stays printed.
export async function displayDb(): Promise<Db> {
  const db = await seededDb();
  await db.update(stores).set({ qr_mode: "display", qr_secret: SECRET, display_key: DISPLAY_KEY }).where(eq(stores.id, "store-1"));
  return db;
}
