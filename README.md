# expo sphere

expo sphere is a Next.js app backed by Supabase Postgres for event services and expo recruitment. Next.js owns accounts, OTPs, passwords, sessions, and portal authorization.

## Features

- Email/password signup with app-generated, MXroute-delivered six-digit codes
- App-owned accounts and HttpOnly sessions
- Role-based dashboards
- Public role browsing
- Exhibitor staffing request form
- Event talent application action
- Admin-only private contact storage
- Agency-to-exhibitor talent recommendations
- Password login, email OTP login, email verification, and password recovery
- Bidirectional Event Talent and Exhibitor reputation scores
- Published testimonials with admin moderation
- Category scores for reliability, communication, and professionalism
- Admin verification and score management surfaces
- Agency client and commission tracking surfaces
- Supabase Postgres schema and server-side authorization

## Setup

1. Install dependencies:

```bash
npm install
```

2. Copy environment variables:

```bash
cp .env.example .env.local
```

3. Fill in the Supabase and MXroute settings:

```bash
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
APP_AUTH_SECRET=
SMTP_HOST=chocobo.mxrouting.net
SMTP_AUTH_USER=
SMTP_AUTH_PASS=
SMTP_FROM=
```

4. Generate a random `APP_AUTH_SECRET` of at least 32 characters and configure MXroute. Next.js generates six-digit OTPs that expire in 10 minutes and submits messages through MXroute's HTTPS API. `SMTP_HOST` names your MXroute server; `SMTP_PORT` and `SMTP_SECURE` from older configurations are ignored. Supabase Auth email settings are not used.

Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` locally and `NEXT_PUBLIC_APP_URL=https://eventrecruit.vercel.app` in production.

5. Apply migrations in order through `supabase/migrations/007_password_login_rate_limit.sql`. **Migration 006 deletes existing Supabase Auth-linked account and portal records**, as requested for a fresh start. Do not run the old seed file after this migration; it contains legacy identities. Migration 007 adds a separate password-login attempt limit and is required before deploying the updated login action. The service-role key must remain server-only. The application uses a server-only database client; all portal actions must check the app session, role, and record ownership before querying or changing protected records.

6. Start the app:

```bash
npm run dev
```

Run `npm run diagnose:email` to check HTTPS API reachability without sending credentials or email. It cannot verify mailbox authentication or actual delivery. Signup failures report a request ID, transport, stage, and safe category; a successful provider response confirms API acceptance, not inbox arrival. After a verified account signs up, use `npm run auth:grant-admin -- email@example.com` locally to designate its owner as the first administrator.

For Vercel, configure `NEXT_PUBLIC_SUPABASE_URL` (or `SUPABASE_URL`), `SUPABASE_SERVICE_ROLE_KEY`, `APP_AUTH_SECRET` (at least 32 characters), `SMTP_HOST`, `SMTP_AUTH_USER`, `SMTP_AUTH_PASS`, `SMTP_FROM`, and `NEXT_PUBLIC_APP_URL` in the project's **Production** environment. `.env.local` is local-only and is not uploaded with the deployment. Redeploy after changing Production variables. The app must also have migrations 005–007 applied to the same Supabase project as those variables. If a signup logs `auth_rate_limit_failed`, no email request was made: `auth_secret_missing` or `database_configuration_missing` means a Production setting is missing; `migration_missing` means the rate-limit RPC is absent; `database_auth_rejected` means the configured key or database grants are wrong. Keep secret values out of logs and support requests.

The public role browser and admin verification queue now read live database records. Other dashboard cards and actions built from `src/lib/mock-data.ts` are illustrative preview data; they are not reliable representations of a new account's records and need database-backed replacements before production use.

Rotate the SMTP password and Supabase service-role key that were exposed in earlier screenshots. Rotate `APP_AUTH_SECRET` only as a deliberate session and OTP invalidation action.

## Notes

The UI includes representative marketplace data so the product can be reviewed before a Supabase project is connected. Database writes require Supabase environment variables and the migration to be applied.

Private phone and contact fields are stored in `contact_details`. The admin page is gated by app-owned sessions and role checks. Direct anonymous and authenticated API access to portal tables is revoked by migration 006.

Reputation uses `profile_reputation`, `placement_reviews`, and `reputation_events`. Exhibitors can review event talent after completed placements, event talent can review exhibitors after completed placements, and agencies can use scores for matching without submitting or receiving reviews in this version.
