CREATE TYPE "public"."location_status" AS ENUM('inside', 'outside', 'unknown');--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "lat" double precision;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "lng" double precision;--> statement-breakpoint
ALTER TABLE "stores" ADD COLUMN "radius_m" integer DEFAULT 150 NOT NULL;--> statement-breakpoint
ALTER TABLE "timelogs" ADD COLUMN "location_status" "location_status";