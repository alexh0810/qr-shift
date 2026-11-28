CREATE TABLE "corrections" (
	"id" text PRIMARY KEY NOT NULL,
	"timelog_id" text NOT NULL,
	"old_timestamp" timestamp with time zone,
	"new_timestamp" timestamp with time zone NOT NULL,
	"changed_by" text NOT NULL,
	"reason" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "corrections_reason_length" CHECK (char_length(btrim("corrections"."reason")) between 3 and 500)
);
--> statement-breakpoint
ALTER TABLE "corrections" ADD CONSTRAINT "corrections_timelog_id_timelogs_id_fk" FOREIGN KEY ("timelog_id") REFERENCES "public"."timelogs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "corrections_timelog_idx" ON "corrections" USING btree ("timelog_id");