CREATE TYPE "public"."member_role" AS ENUM('owner', 'manager');--> statement-breakpoint
CREATE TABLE "store_members" (
	"store_id" text NOT NULL,
	"email" text NOT NULL,
	"role" "member_role" NOT NULL,
	CONSTRAINT "store_members_store_id_email_pk" PRIMARY KEY("store_id","email")
);
--> statement-breakpoint
ALTER TABLE "store_members" ADD CONSTRAINT "store_members_store_id_stores_id_fk" FOREIGN KEY ("store_id") REFERENCES "public"."stores"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "store_members_email_idx" ON "store_members" USING btree ("email");