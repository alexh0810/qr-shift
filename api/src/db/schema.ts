import { index, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const employeeStatus = pgEnum("employee_status", ["active", "archived"]);
export const timelogType = pgEnum("timelog_type", ["IN", "OUT"]);

export const stores = pgTable("stores", {
  id: text().primaryKey(),
  name: text().notNull(),
  qr_token: text().notNull().unique(),
  pin_hash: text(),
  created_at: timestamp({ withTimezone: true }).notNull().defaultNow(),
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
  },
  (t) => [
    index("timelogs_employee_ts_idx").on(t.employee_id, t.timestamp.desc()),
    index("timelogs_store_ts_idx").on(t.store_id, t.timestamp),
  ],
);
