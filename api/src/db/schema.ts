import { sql } from "drizzle-orm";
import { check, doublePrecision, index, integer, pgEnum, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const employeeStatus = pgEnum("employee_status", ["active", "archived"]);
export const timelogType = pgEnum("timelog_type", ["IN", "OUT"]);
export const qrMode = pgEnum("qr_mode", ["display", "printed"]);
export const locationStatus = pgEnum("location_status", ["inside", "outside", "unknown"]);

export const stores = pgTable("stores", {
  id: text().primaryKey(),
  name: text().notNull(),
  qr_token: text().notNull().unique(),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  qr_mode: qrMode().notNull().default("printed"),
  qr_secret: text(),
  display_key: text(),
  lat: doublePrecision(),
  lng: doublePrecision(),
  radius_m: integer().notNull().default(150),
});

export const employees = pgTable(
  "employees",
  {
    id: text().primaryKey(),
    store_id: text().notNull().references(() => stores.id),
    name: text().notNull(),
    status: employeeStatus().notNull().default("active"),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("employees_store_idx").on(t.store_id)],
);

export const timelogs = pgTable(
  "timelogs",
  {
    id: text().primaryKey(),
    employee_id: text().notNull().references(() => employees.id),
    store_id: text().notNull().references(() => stores.id),
    type: timelogType().notNull(),
    timestamp: timestamp({ withTimezone: true }).notNull(),
    location_status: locationStatus(),
  },
  (t) => [
    index("timelogs_employee_ts_idx").on(t.employee_id, t.timestamp.desc()),
    index("timelogs_store_ts_idx").on(t.store_id, t.timestamp),
  ],
);

export const memberRole = pgEnum("member_role", ["owner", "manager"]);

export const storeMembers = pgTable(
  "store_members",
  {
    store_id: text().notNull().references(() => stores.id),
    email: text().notNull(),
    role: memberRole().notNull(),
  },
  (t) => [primaryKey({ columns: [t.store_id, t.email] }), index("store_members_email_idx").on(t.email)],
);

export const corrections = pgTable(
  "corrections",
  {
    id: text().primaryKey(),
    timelog_id: text().notNull().references(() => timelogs.id),
    old_timestamp: timestamp({ withTimezone: true }),
    new_timestamp: timestamp({ withTimezone: true }).notNull(),
    changed_by: text().notNull(),
    reason: text().notNull(),
    created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("corrections_timelog_idx").on(t.timelog_id),
    check("corrections_reason_length", sql`char_length(btrim(${t.reason})) between 3 and 500`),
  ],
);
