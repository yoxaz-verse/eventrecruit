# Event company portal

## Database rollout

Apply `supabase/migrations/003_organizer_role.sql`, commit it, then apply `supabase/migrations/004_organizer_portal.sql` to the configured Supabase project before deploying the application. The enum addition must commit before the next migration uses it. Existing migrations 001 and 002 are prerequisites. Do not rerun initial migrations on an existing database.

The migrations add company and event tables, row-level access policies, a verified-email check, publication history tracking, and protection against account role escalation. Existing accounts retain their roles. Privileged SQL provisioning can still create administrators; public signup cannot.

Company information is public; owner identifiers are excluded from anonymous column grants. Contact phone stays in the existing private contact table. Company updates currently require re-entering the phone because the existing table permits reading it only by administrators.

## Local verification

- `npm run lint`
- `npm run build`
- `node --test tests/organizer.test.mjs`

Browser checks performed: organizer signup is preselected, anonymous organizer dashboard redirects to login, mobile signup width is 390px without horizontal overflow, and directory service-unavailable feedback renders.

Database integration checks remain pending: no Supabase CLI or Postgres client is installed, and local Docker is not running. No migrations were applied to a remote database and no deployment was performed.

## Acceptance checks after migration

Use two verified organizer test accounts, an administrator, an existing talent account, and an anonymous session:

1. Register and verify an organizer via email. Dashboard routes to company setup until the company is saved. Returning password and OTP logins route to the organizer dashboard.
2. Save company details and private phone. Create two events. Refresh and verify independent persistence, then edit each independently.
3. Save incomplete drafts. Publishing rejects missing details, impossible dates, and reversed date ranges. Publish complete events and verify anonymous directory and detail pages.
4. Verify title/company search, city filters, date ordering, and dashboard phase counts. Past events leave the directory; start and end days remain ongoing in India time.
5. Unpublish an event: anonymous and other company sessions cannot read it, even via direct database requests. Cancel a previously published event: its detail page shows cancellation and it leaves the directory. A never-published cancelled event remains private.
6. Attempt forged event IDs/company IDs through both server actions and direct Supabase requests. Other companies cannot update or read drafts. Ownership cannot be changed. Admin database access is permitted.
7. Anonymous users cannot select company owner identifiers or private contact details. Signup metadata cannot request admin; normal users cannot update their profile role or verification status. Unverified organizers cannot insert companies or publish events.
8. Simulate a failed save and retry: entered form values remain. Verify existing talent, exhibitor, agency and admin login routing and staffing workflows still operate.
9. Inspect populated dashboard, company and event forms, and event detail pages at desktop and mobile widths using real test records.

V1 has one owner per company; admin event management is available through database policies, not a new admin UI. Events are independent of staffing requests.
