DROP INDEX "payment_links_org_slug_idx";--> statement-breakpoint
ALTER TABLE "payments" ADD COLUMN "idempotency_key" text;--> statement-breakpoint
CREATE UNIQUE INDEX "payment_links_org_slug_uidx" ON "payment_links" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE UNIQUE INDEX "payments_idempotency_key_uidx" ON "payments" USING btree ("idempotency_key");