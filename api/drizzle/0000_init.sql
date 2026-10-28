CREATE TYPE "public"."employee_status" AS ENUM('active', 'archived');--> statement-breakpoint
CREATE TYPE "public"."timelog_type" AS ENUM('IN', 'OUT');--> statement-breakpoint
CREATE TABLE "employees" (
	"id" text PRIMARY KEY NOT NULL,
	"store_id" text NOT NULL,
	"name" text NOT NULL,
	"status" "employee_status" DEFAULT 'active' NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stores" (
	"id" text PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"qr_token" text NOT NULL,
	"pin_hash" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "stores_qr_token_unique" UNIQUE("qr_token")
);
--> statement-breakpoint
CREATE TABLE "timelogs" (
	"id" text PRIMARY KEY NOT NULL,
	"employee_id" text NOT NULL,
	"store_id" text NOT NULL,
	"type" timelog_type NOT NULL,
	"timestamp" timestamp with time zone NOT NULL
);
--> statement-breakpoint
ALTER TABLE "employees" ADD CONSTRAINT "employees_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timelogs" ADD CONSTRAINT "timelogs_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "timelogs" ADD CONSTRAINT "timelogs_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "employees_store_idx" ON "employees" USING btree ("store_id");--> statement-breakpoint
CREATE INDEX "timelogs_employee_ts_idx" ON "timelogs" USING btree ("employee_id","timestamp" DESC NULLS LAST);--> statement-breakpoint
CREATE INDEX "timelogs_store_ts_idx" ON "timelogs" USING btree ("store_id","timestamp");