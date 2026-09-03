# EventRecruit

EventRecruit is a Next.js + Supabase MVP for event services and expo recruitment. It supports role-based panels for admins, agencies, exhibitors, and event talent.

## Features

- Email/password signup with role metadata
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

3. Fill in:

```bash
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

4. Add Supabase Auth redirect URLs:

```text
http://localhost:3000/auth/callback
https://your-production-domain.com/auth/callback
```

5. Apply `supabase/migrations/001_initial_schema.sql` in Supabase, then optionally run `supabase/seed.sql`.

6. Start the app:

```bash
npm run dev
```

## Notes

The UI includes representative marketplace data so the product can be reviewed before a Supabase project is connected. Database writes require Supabase environment variables and the migration to be applied.

Private phone and contact fields are stored in `contact_details`. Supabase RLS allows only admins to read those fields; exhibitors, agencies, and event talent only see public profile signals.

Reputation uses `profile_reputation`, `placement_reviews`, and `reputation_events`. Exhibitors can review event talent after completed placements, event talent can review exhibitors after completed placements, and agencies can use scores for matching without submitting or receiving reviews in this version.
