# Kivaro

Kivaro is a recurring-payments SaaS for Ghanaian churches, mosques, NGOs, schools, and community groups. Organizations mint simple payment links and donation pages, share them anywhere (including QR codes), and collect one-time or recurring contributions paid with **MTN Mobile Money** (MoMo Collection API).

## Features

- **Auth** — email/password sign-up & login, email verification, forgot/reset password, optional Google sign-in (managed by Neon Auth). Invite teammates via secret `?invite=<token>` registration links.
- **Onboarding** — first-run setup: organization profile → MTN MoMo status → first payment link.
- **Payment links** — create/pause/edit/delete links with suggested amounts, one-time or recurring (weekly/monthly/yearly) toggles, share/copy URLs and QR codes.
- **Campaigns** — each campaign gets its own public page with a progress bar and raised total.
- **Public giving pages** — `/give/<orgSlug>`, `/give/<orgSlug>/link/<linkSlug>`, `/give/<orgSlug>/<campaignSlug>`; supporters enter their MTN MoMo number and approve the payment in their phone's MoMo app.
- **Recurring subscription management** — MTN MoMo **pre-approvals**: supporters authorize automatic debits once, Kivaro charges them on schedule (cron), and the dashboard owner can cancel anytime.
- **Dashboard** — overview (totals, 6-month chart, recent contributions), contributions table, reports with CSV export, team roles (owner/admin), settings, notifications bell.
- **Webhooks** — MTN MoMo callback handler with event deduplication; settles one-time charges and pre-approvals, with in-app notifications.

## Tech

- Next.js 16 (App Router) + TypeScript
- Neon Postgres + Neon Auth (managed Better Auth) — Drizzle ORM
- MTN MoMo Collection API (server-side credentials only)
- Tailwind CSS v4

Note: on some Windows machines the native SWC binary fails, so build with:

```bash
npx next build --webpack
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Copy the environment template and fill in your values:

```bash
cp .env.example .env.local
```

Required in `.env.local`:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Neon Postgres connection string |
| `NEON_AUTH_BASE_URL` | Your Neon Auth endpoint |
| `NEON_AUTH_COOKIE_SECRET` | 32+ char secret used to sign session cookies |
| `MTN_API_USER` / `MTN_API_KEY` | MTN MoMo Collection API credentials (sandbox or production portal) |
| `MTN_COLLECTION_PRIMARY_KEY` | Collection product `Ocp-Apim-Subscription-Key` |
| `MTN_TARGET_ENVIRONMENT` | `sandbox` or market code (e.g. `mtnghana`) in production |
| `CRON_SECRET` | Guards the recurring-debit endpoint |
| `NEXT_PUBLIC_APP_URL` | Public origin — used for share links and QR codes |
| `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED` | `true` only after enabling Google OAuth in the Neon Console |

3. Create the database schema (this project uses Drizzle migrations):

```bash
npm run db:migrate
# or generate schema changes with: npm run db:generate
```

4. Run the development server:

```bash
npm run dev
```

Open http://localhost:3000. Sign up, complete onboarding, create a payment link, and share it.

## MTN MoMo setup

1. Create an API user + key on the MoMo developer portal ([sandbox](https://sandbox.momodeveloper.mtn.com) / production) and enable the **Collection** product.
2. Put the credentials in `.env.local` (see table above). Set `MTN_PAYEE_MSISDN` to the number your funds settle to, in country-code form (`2335xxxxxxxx`).
3. Register the collection callback URL so payment/pre-approval outcomes reach Kivaro:

```
https://<your-domain>/api/webhooks/mtn
```

Set `MTN_CALLBACK_URL` to the same value.

### Recurring debits (cron)

Automatic recurring charges run in the `/api/cron/subscriptions` endpoint, guarded by `x-cron-secret: <CRON_SECRET>`. Schedule it (Vercel Cron / cron-job.org) on the same cadence as your subscriptions, e.g. daily.

```bash
curl -H "x-cron-secret: $CRON_SECRET" https://<your-domain>/api/cron/subscriptions
```

Each due subscription is charged via the payer's approved pre-approval (no MoMo prompt) — outcomes settle through the webhook.

### Sandbox currency note

The MTN **sandbox always processes in EUR** internally, regardless of the currency sent. Kivaro sends GHS; in production MTN honours GHS. Sandbox amounts map 1:1 for testing.

## Neon Auth setup

- Enable **email** delivery in the Neon Console so verification and password-reset emails can be sent. Create users via the app's `/register` page.
- (Optional) Enable **Google OAuth** and set `NEXT_PUBLIC_AUTH_GOOGLE_ENABLED=true`.

## Money & data

- Amounts are stored as integers in the smallest currency unit (pesewas); the UI divides by 100 (`formatCurrencyFromMinor` in `src/lib/utils.ts`).
- Every payment row carries the MTN transaction id (`mtn_transaction_id`) and every subscription the payer's pre-approval id (`mtn_pre_approval_id`) + MSISDN, so events are attributed idempotently.

## Deploy

Deploy the Next.js app to Vercel, set the environment variables from `.env.local`, register the MTN callback on your production URL, and push the Drizzle migrations to your production database.