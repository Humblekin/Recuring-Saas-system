CREATE TABLE "campaigns" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"payment_link_id" uuid,
	"title" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"goal_amount" integer,
	"currency" text DEFAULT 'GHS',
	"start_date" timestamp,
	"end_date" timestamp,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "notifications" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"type" text NOT NULL,
	"title" text NOT NULL,
	"message" text NOT NULL,
	"payload" jsonb,
	"read_at" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "organizations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"type" text DEFAULT 'other',
	"email" text,
	"phone" text,
	"country" text,
	"website" text,
	"logo_url" text,
	"primary_color" text DEFAULT '#1A1A1A',
	"verified" boolean DEFAULT false,
	"invite_token" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "organizations_slug_unique" UNIQUE("slug")
);
--> statement-breakpoint
CREATE TABLE "payment_links" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"name" text NOT NULL,
	"slug" text NOT NULL,
	"description" text,
	"amounts" integer[] DEFAULT '{}',
	"one_time_enabled" boolean DEFAULT true,
	"recurring_enabled" boolean DEFAULT true,
	"frequencies" text[] DEFAULT '{"weekly","monthly","yearly"}',
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "payments" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"reference" text NOT NULL,
	"organization_id" uuid NOT NULL,
	"payment_link_id" uuid,
	"campaign_id" uuid,
	"supporter_id" uuid,
	"subscription_id" uuid,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'GHS',
	"status" text NOT NULL,
	"payment_method" text,
	"is_recurring" boolean DEFAULT false,
	"mtn_transaction_id" text,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "payments_reference_unique" UNIQUE("reference")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"organization_id" uuid NOT NULL,
	"supporter_id" uuid NOT NULL,
	"payment_link_id" uuid,
	"campaign_id" uuid,
	"mtn_pre_approval_id" text,
	"payer_msisdn" text,
	"amount" integer NOT NULL,
	"currency" text DEFAULT 'GHS',
	"interval" text NOT NULL,
	"status" text NOT NULL,
	"next_billing_date" timestamp,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"canceled_at" timestamp
);
--> statement-breakpoint
CREATE TABLE "supporters" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"phone" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "supporters_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"neon_auth_id" text NOT NULL,
	"email" text NOT NULL,
	"name" text,
	"organization_id" uuid,
	"role" text DEFAULT 'owner',
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_neon_auth_id_unique" UNIQUE("neon_auth_id"),
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "webhook_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"event_id" text NOT NULL,
	"event_type" text NOT NULL,
	"processed_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "webhook_events_event_id_unique" UNIQUE("event_id")
);
--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "campaigns" ADD CONSTRAINT "campaigns_payment_link_id_payment_links_id_fk" FOREIGN KEY ("payment_link_id") REFERENCES "public"."payment_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notifications" ADD CONSTRAINT "notifications_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payment_links" ADD CONSTRAINT "payment_links_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_payment_link_id_payment_links_id_fk" FOREIGN KEY ("payment_link_id") REFERENCES "public"."payment_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_supporter_id_supporters_id_fk" FOREIGN KEY ("supporter_id") REFERENCES "public"."supporters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "payments" ADD CONSTRAINT "payments_subscription_id_subscriptions_id_fk" FOREIGN KEY ("subscription_id") REFERENCES "public"."subscriptions"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_supporter_id_supporters_id_fk" FOREIGN KEY ("supporter_id") REFERENCES "public"."supporters"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_payment_link_id_payment_links_id_fk" FOREIGN KEY ("payment_link_id") REFERENCES "public"."payment_links"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_campaign_id_campaigns_id_fk" FOREIGN KEY ("campaign_id") REFERENCES "public"."campaigns"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "users" ADD CONSTRAINT "users_organization_id_organizations_id_fk" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "campaigns_org_idx" ON "campaigns" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "notifications_org_created_idx" ON "notifications" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "organizations_slug_idx" ON "organizations" USING btree ("slug");--> statement-breakpoint
CREATE UNIQUE INDEX "organizations_invite_token_idx" ON "organizations" USING btree ("invite_token");--> statement-breakpoint
CREATE INDEX "payment_links_org_idx" ON "payment_links" USING btree ("organization_id");--> statement-breakpoint
CREATE INDEX "payment_links_org_slug_idx" ON "payment_links" USING btree ("organization_id","slug");--> statement-breakpoint
CREATE INDEX "payments_org_status_idx" ON "payments" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "payments_org_created_idx" ON "payments" USING btree ("organization_id","created_at");--> statement-breakpoint
CREATE INDEX "payments_supporter_idx" ON "payments" USING btree ("supporter_id");--> statement-breakpoint
CREATE INDEX "payments_reference_idx" ON "payments" USING btree ("reference");--> statement-breakpoint
CREATE INDEX "subscriptions_org_status_idx" ON "subscriptions" USING btree ("organization_id","status");--> statement-breakpoint
CREATE INDEX "subscriptions_supporter_idx" ON "subscriptions" USING btree ("supporter_id");--> statement-breakpoint
CREATE INDEX "subscriptions_mtn_pre_approval_idx" ON "subscriptions" USING btree ("mtn_pre_approval_id");--> statement-breakpoint
CREATE UNIQUE INDEX "subscriptions_org_mtn_pre_approval_unique_idx" ON "subscriptions" USING btree ("organization_id","mtn_pre_approval_id");--> statement-breakpoint
CREATE INDEX "webhook_events_event_id_idx" ON "webhook_events" USING btree ("event_id");