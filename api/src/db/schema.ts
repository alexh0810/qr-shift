import { doublePrecision, index, integer, pgEnum, pgTable, primaryKey, text, timestamp } from "drizzle-orm/pg-core";

export const employeeStatus = pgEnum("employee_status", ["active", "archived"]);
export const timelogType = pgEnum("timelog_type", ["IN", "OUT"]);
export const qrMode = pgEnum("qr_mode", ["display", "printed"]);
export const locationStatus = pgEnum("location_status", ["inside", "outside", "unknown"]);

export const stores = pgTable("stores", {
  id: text().primaryKey(),
  name: text().notNull(),
  qr_token: text().notNull().unique(),
  pin_hash: text(),
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
