CREATE INDEX IF NOT EXISTS "idx_tickets_status_position" ON "tickets" USING btree ("status","position");--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tickets_due_date" ON "tickets" USING btree ("due_date") WHERE "tickets"."due_date" IS NOT NULL;--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "idx_tickets_created_at" ON "tickets" USING btree ("created_at" DESC NULLS LAST);