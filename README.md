# EventRecruit

EventRecruit is a Next.js + Supabase MVP for event services and expo recruitment. It supports role-based panels for admins, agencies, exhibitors, and event talent.

## Features

- Email/password signup with role metadata and MXroute-delivered verification codes
- Supabase profile trigger for new users
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
- Supabase schema, seed data, and RLS policies

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
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SMTP_HOST=chocobo.mxrouting.net
SMTP_PORT=587
SMTP_SECURE=false
SMTP_AUTH_USER=
SMTP_AUTH_PASS=
SMTP_FROM=
```

4. Keep the Supabase email provider and email confirmation enabled. Configure email OTPs as six digits with a 600-second expiry. EventRecruit generates Supabase OTPs on the server and delivers the codes through MXroute; do not configure a Send Email Hook. Disable Supabase Auth security notification emails in the project settings if all application emails must come from MXroute.

Set `NEXT_PUBLIC_APP_URL=http://localhost:3000` locally and `NEXT_PUBLIC_APP_URL=https://eventrecruit.vercel.app` in production.

5. Apply migrations in order through `supabase/migrations/005_auth_email_delivery.sql`, then optionally run `supabase/seed.sql` for a new development project. Migration 005 adds service-role-only email rate limiting and account lookup helpers; it does not replace Supabase Auth or existing users. Rate-limit identifiers are keyed hashes and reset when the service-role key is rotated.

6. Start the app:

```bash
npm run dev
```

Direct calls to the public Supabase Auth API can still trigger Supabase-managed email. Without a Send Email Hook, this project can guarantee only that **EventRecruit's own email request actions** use MXroute. Restrict other clients to the same application flows and review the Supabase Auth email settings before rollout.

## Notes

The UI includes representative marketplace data so the product can be reviewed before a Supabase project is connected. Database writes require Supabase environment variables and the migration to be applied.

Private phone and contact fields are stored in `contact_details`. Supabase RLS allows only admins to read those fields; exhibitors, agencies, and event talent only see public profile signals.

Reputation uses `profile_reputation`, `placement_reviews`, and `reputation_events`. Exhibitors can review event talent after completed placements, event talent can review exhibitors after completed placements, and agencies can use scores for matching without submitting or receiving reviews in this version.
