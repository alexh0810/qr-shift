CREATE TYPE "public"."qr_mode" AS ENUM('display', 'printed');--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "qr_mode" "qr_mode" DEFAULT 'printed' NOT NULL;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "qr_secret" text;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "display_key" text;