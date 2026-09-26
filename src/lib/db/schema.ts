import { pgTable, index, uniqueIndex, text, integer, boolean, timestamp, uuid, jsonb } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// =============================================================================
// DATABASE SCHEMA — Drizzle ORM + Neon PostgreSQL
// =============================================================================
// Money is stored in the lowest denomination (pesewas / cent). Convert for UI
// with `formatCurrencyFromMinor`/`formatCurrency` in `src/lib/utils.ts`.

// --- Users (links Neon Auth identity to our system; also acts as org membership) ---
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  neonAuthId: text('neon_auth_id').unique().notNull(),
  email: text('email').unique().notNull(),
  name: text('name'),
  organizationId: uuid('organization_id').references(() => organizations.id),
  role: text('role').default('owner'), // 'owner', 'admin'
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Organizations ---
export const organizationTypes = [
  'church',
  'mosque',
  'ngo',
  'school',
  'association',
  'community',
  'business',
  'other',
] as const;
export type OrganizationType = (typeof organizationTypes)[number];

export const organizations = pgTable(
  'organizations',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    name: text('name').notNull(),
    slug: text('slug').unique().notNull(),
    description: text('description'),
    type: text('type').default('other'),
    email: text('email'),
    phone: text('phone'),
    country: text('country'),
    website: text('website'),
    logoUrl: text('logo_url'),
    primaryColor: text('primary_color').default('#1A1A1A'),
    verified: boolean('verified').default(false),
    // Secret, random code used in team-invite registration links
    // (`/register?invite=<token>`). Never exposed on any public page. Unlike
    // the org slug (which is public in every give URL) this cannot be guessed.
    inviteToken: text('invite_token'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('organizations_slug_idx').on(table.slug),
    uniqueIndex('organizations_invite_token_idx').on(table.inviteToken),
  ],
);

// --- Payment Links (CORE FEATURE) ---
// A payment link belongs to an organization. It defines amounts, toggles and
// frequencies for its public giving page.
export const paymentLinks = pgTable(
  'payment_links',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id)
      .notNull(),
    name: text('name').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    // Suggested amounts in the lowest denomination (pesewas), e.g. {2000, 5000, 10000}
    amounts: integer('amounts').array().default([]),
    oneTimeEnabled: boolean('one_time_enabled').default(true),
    recurringEnabled: boolean('recurring_enabled').default(true),
    // Supported recurring frequencies: subset of ['weekly', 'monthly', 'yearly']
    frequencies: text('frequencies').array().default(['weekly', 'monthly', 'yearly']),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => [
    index('payment_links_org_idx').on(table.organizationId),
    // UNIQUE, not just indexed: a payment link's slug is its public URL
    // (/give/<org>/link/<slug>). Two links sharing a slug made that route
    // resolve arbitrarily via findFirst, silently mixing two payment configs.
    uniqueIndex('payment_links_org_slug_uidx').on(table.organizationId, table.slug),
  ],
);

// --- Campaigns ---
export const campaigns = pgTable(
  'campaigns',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id)
      .notNull(),
    paymentLinkId: uuid('payment_link_id').references(() => paymentLinks.id, { onDelete: 'set null' }),
    title: text('title').notNull(),
    slug: text('slug').notNull(),
    description: text('description'),
    goalAmount: integer('goal_amount'),
    currency: text('currency').default('GHS'),
    startDate: timestamp('start_date'),
    endDate: timestamp('end_date'),
    isActive: boolean('is_active').default(true),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('campaigns_org_idx').on(table.organizationId)],
);

// --- Supporters (people who contribute) ---
export const supporters = pgTable('supporters', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').unique().notNull(),
  name: text('name'),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// --- Payments ---
export const paymentStatuses = ['pending', 'success', 'failed', 'refunded'] as const;
export type PaymentStatus = (typeof paymentStatuses)[number];

export const payments = pgTable(
  'payments',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    reference: text('reference').unique().notNull(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id)
      .notNull(),
    paymentLinkId: uuid('payment_link_id').references(() => paymentLinks.id, { onDelete: 'set null' }),
    campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
    supporterId: uuid('supporter_id').references(() => supporters.id),
    subscriptionId: uuid('subscription_id').references(() => subscriptions.id, { onDelete: 'set null' }),
    amount: integer('amount').notNull(),
    currency: text('currency').default('GHS'),
    status: text('status').notNull(), // 'pending', 'success', 'failed', 'refunded'
    paymentMethod: text('payment_method'),
    isRecurring: boolean('is_recurring').default(false),
    mtnTransactionId: text('mtn_transaction_id'),
    // Client-supplied idempotency key (UUID) for one-time checkouts. A supporter
    // whose request times out and who retries MUST NOT be charged twice: the
    // retry replays this same key, we find the existing row, and we return the
    // original MTN reference instead of issuing a second charge. NULL on rows
    // created before this existed and on cron-generated recurring debits.
    idempotencyKey: text('idempotency_key'),
    metadata: jsonb('metadata'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [
    index('payments_org_status_idx').on(table.organizationId, table.status),
    index('payments_org_created_idx').on(table.organizationId, table.createdAt),
    index('payments_supporter_idx').on(table.supporterId),
    index('payments_reference_idx').on(table.reference),
    // Postgres treats NULLs as distinct, so legacy/cron rows are unaffected.
    uniqueIndex('payments_idempotency_key_uidx').on(table.idempotencyKey),
  ],
);

// --- Subscriptions (recurring) ---
export const subscriptions = pgTable(
  'subscriptions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id)
      .notNull(),
    supporterId: uuid('supporter_id').references(() => supporters.id).notNull(),
    paymentLinkId: uuid('payment_link_id').references(() => paymentLinks.id, { onDelete: 'set null' }),
    campaignId: uuid('campaign_id').references(() => campaigns.id, { onDelete: 'set null' }),
    // MTN MoMo Pre-Approval id created at checkout; the payer authorizes this
    // in their MoMo app before the subscription can be charged automatically.
    mtnPreApprovalId: text('mtn_pre_approval_id'),
    // Some docs name this the payer's consent id — mirror it for reporting.
    payerMsisdn: text('payer_msisdn'),

    amount: integer('amount').notNull(),
    currency: text('currency').default('GHS'),
    interval: text('interval').notNull(), // 'weekly', 'monthly', 'yearly'
    status: text('status').notNull(), // 'pending_authorization', 'active', 'past_due', 'canceled'
    nextBillingDate: timestamp('next_billing_date'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    canceledAt: timestamp('canceled_at'),
  },
(table) => [
    index('subscriptions_org_status_idx').on(table.organizationId, table.status),
    index('subscriptions_supporter_idx').on(table.supporterId),
    index('subscriptions_mtn_pre_approval_idx').on(table.mtnPreApprovalId),
    // One active record per (org, MTN pre-approval) — enables idempotent upserts
    // in the webhook so a duplicate/replayed event never creates duplicates.
    uniqueIndex('subscriptions_org_mtn_pre_approval_unique_idx').on(table.organizationId, table.mtnPreApprovalId),
  ],
);

// --- Webhook Events (idempotency) ---
// MTN can re-deliver webhooks. Store processed event ids to guarantee a
// duplicate webhook never creates duplicate contribution records.
export const webhookEvents = pgTable(
  'webhook_events',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    eventId: text('event_id').unique().notNull(),
    eventType: text('event_type').notNull(),
    processedAt: timestamp('processed_at').defaultNow().notNull(),
  },
  (table) => [index('webhook_events_event_id_idx').on(table.eventId)],
);

// --- Notifications (in-app) ---
export const notifications = pgTable(
  'notifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    organizationId: uuid('organization_id')
      .references(() => organizations.id)
      .notNull(),
    type: text('type').notNull(), // 'payment_success' | 'payment_failed' | 'subscription_active' | 'subscription_failed' | 'subscription_canceled'
    title: text('title').notNull(),
    message: text('message').notNull(),
    payload: jsonb('payload'),
    readAt: timestamp('read_at'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
  },
  (table) => [index('notifications_org_created_idx').on(table.organizationId, table.createdAt)],
);

// =============================================================================
// RELATIONS — powers `db.query.table.findMany({ with })`
// =============================================================================

export const usersRelations = relations(users, ({ one }) => ({
  organization: one(organizations, {
    fields: [users.organizationId],
    references: [organizations.id],
  }),
}));

export const organizationsRelations = relations(organizations, ({ many }) => ({
  users: many(users),
  campaigns: many(campaigns),
  payments: many(payments),
  subscriptions: many(subscriptions),
  paymentLinks: many(paymentLinks),
  notifications: many(notifications),
}));

export const paymentLinksRelations = relations(paymentLinks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [paymentLinks.organizationId],
    references: [organizations.id],
  }),
  campaigns: many(campaigns),
  payments: many(payments),
  subscriptions: many(subscriptions),
}));

export const campaignsRelations = relations(campaigns, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [campaigns.organizationId],
    references: [organizations.id],
  }),
  paymentLink: one(paymentLinks, {
    fields: [campaigns.paymentLinkId],
    references: [paymentLinks.id],
  }),
  payments: many(payments),
  subscriptions: many(subscriptions),
}));

export const supportersRelations = relations(supporters, ({ many }) => ({
  payments: many(payments),
  subscriptions: many(subscriptions),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  organization: one(organizations, {
    fields: [payments.organizationId],
    references: [organizations.id],
  }),
  paymentLink: one(paymentLinks, {
    fields: [payments.paymentLinkId],
    references: [paymentLinks.id],
  }),
  campaign: one(campaigns, {
    fields: [payments.campaignId],
    references: [campaigns.id],
  }),
  supporter: one(supporters, {
    fields: [payments.supporterId],
    references: [supporters.id],
  }),
  subscription: one(subscriptions, {
    fields: [payments.subscriptionId],
    references: [subscriptions.id],
  }),
}));

export const subscriptionsRelations = relations(subscriptions, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [subscriptions.organizationId],
    references: [organizations.id],
  }),
  supporter: one(supporters, {
    fields: [subscriptions.supporterId],
    references: [supporters.id],
  }),
  paymentLink: one(paymentLinks, {
    fields: [subscriptions.paymentLinkId],
    references: [paymentLinks.id],
  }),
  campaign: one(campaigns, {
    fields: [subscriptions.campaignId],
    references: [campaigns.id],
  }),
  payments: many(payments),
}));

export const webhookEventsRelations = relations(webhookEvents, () => ({}));

export const notificationsRelations = relations(notifications, ({ one }) => ({
  organization: one(organizations, {
    fields: [notifications.organizationId],
    references: [organizations.id],
  }),
}));
