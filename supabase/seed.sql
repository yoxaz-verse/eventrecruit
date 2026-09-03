insert into auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  raw_user_meta_data,
  created_at,
  updated_at
)
values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'admin@eventrecruit.local', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Admin User","role":"admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'agency@eventrecruit.local', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Prime Booth Talent","role":"agency"}', now(), now()),
  ('00000000-0000-0000-0000-000000000003', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'exhibitor@eventrecruit.local', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Nexa Exhibitions Manager","role":"exhibitor"}', now(), now()),
  ('00000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'talent@eventrecruit.local', crypt('password123', gen_salt('bf')), now(), '{"full_name":"Aisha Rahman","role":"talent"}', now(), now())
on conflict (id) do nothing;

insert into public.profiles (id, full_name, role, verification_status, city)
values
  ('00000000-0000-0000-0000-000000000001', 'Admin User', 'admin', 'verified', 'Dubai'),
  ('00000000-0000-0000-0000-000000000002', 'Prime Booth Talent', 'agency', 'verified', 'Dubai'),
  ('00000000-0000-0000-0000-000000000003', 'Nexa Exhibitions Manager', 'exhibitor', 'verified', 'Dubai'),
  ('00000000-0000-0000-0000-000000000004', 'Aisha Rahman', 'talent', 'verified', 'Dubai')
on conflict (id) do nothing;

insert into public.contact_details (profile_id, phone, whatsapp, alternate_email, emergency_contact)
values
  ('00000000-0000-0000-0000-000000000002', '+971500000002', '+971500000002', 'agency-ops@eventrecruit.local', null),
  ('00000000-0000-0000-0000-000000000003', '+971500000003', '+971500000003', 'exhibitor-ops@eventrecruit.local', null),
  ('00000000-0000-0000-0000-000000000004', '+971500000004', '+971500000004', 'aisha@eventrecruit.local', '+971599999999')
on conflict (profile_id) do nothing;

insert into public.agencies (id, owner_id, name, commission_type, commission_value, verification_status)
values
  ('10000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000002', 'Prime Booth Talent', 'percentage', 12, 'verified')
on conflict (id) do nothing;

insert into public.exhibitors (id, owner_id, agency_id, company_name, industry, verification_status)
values
  ('20000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'Nexa Exhibitions', 'Technology events', 'verified')
on conflict (id) do nothing;

insert into public.profile_reputation (
  profile_id,
  role,
  trust_score,
  average_rating,
  reliability_score,
  communication_score,
  professionalism_score,
  completed_count
)
values
  ('00000000-0000-0000-0000-000000000003', 'exhibitor', 92, 4.70, 94, 91, 93, 41),
  ('00000000-0000-0000-0000-000000000004', 'talent', 96, 4.90, 98, 95, 97, 24)
on conflict (profile_id) do update
set
  trust_score = excluded.trust_score,
  average_rating = excluded.average_rating,
  reliability_score = excluded.reliability_score,
  communication_score = excluded.communication_score,
  professionalism_score = excluded.professionalism_score,
  completed_count = excluded.completed_count,
  updated_at = now();

insert into public.talent_profiles (
  profile_id,
  headline,
  bio,
  skills,
  languages,
  availability,
  experience_years,
  average_rating,
  reliability_score,
  completed_placements
)
values (
  '00000000-0000-0000-0000-000000000004',
  'Product demonstrator and registration host',
  'Experienced event staff for expo booths, lead capture, and customer greeting.',
  array['Lead capture', 'Tech demos', 'Registration'],
  array['English', 'Arabic', 'Hindi'],
  'Weekends and expo seasons',
  2.5,
  4.90,
  98,
  24
)
on conflict (profile_id) do nothing;

insert into public.events (id, exhibitor_id, agency_id, title, venue, city, starts_at, ends_at, created_by)
values (
  '30000000-0000-0000-0000-000000000001',
  '20000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  'Gulf Tech Expo 2026',
  'Dubai World Trade Centre',
  'Dubai',
  '2026-10-18',
  '2026-10-20',
  '00000000-0000-0000-0000-000000000002'
)
on conflict (id) do nothing;

insert into public.staffing_roles (
  id,
  event_id,
  title,
  description,
  headcount,
  hourly_rate,
  shift_start,
  shift_end,
  required_skills
)
values (
  '40000000-0000-0000-0000-000000000001',
  '30000000-0000-0000-0000-000000000001',
  'Product Demonstrator',
  'Demo booth software, answer visitor questions, and capture leads.',
  12,
  140,
  '09:00',
  '18:00',
  array['English', 'Lead capture', 'Tech demos']
)
on conflict (id) do nothing;

insert into public.staffing_roles (
  id,
  event_id,
  title,
  description,
  headcount,
  hourly_rate,
  shift_start,
  shift_end,
  required_skills
)
values
  (
    '40000000-0000-0000-0000-000000000002',
    '30000000-0000-0000-0000-000000000001',
    'Brand Host',
    'Welcome visitors, support product sampling, and collect booth feedback.',
    8,
    95,
    '10:00',
    '20:00',
    array['Hindi', 'Customer greeting', 'Sampling']
  ),
  (
    '40000000-0000-0000-0000-000000000003',
    '30000000-0000-0000-0000-000000000001',
    'Registration Crew',
    'Handle check-in desks, visitor queues, and badge support.',
    16,
    110,
    '08:30',
    '17:30',
    array['Check-in', 'Queue handling', 'Arabic']
  )
on conflict (id) do nothing;

insert into public.talent_recommendations (
  id,
  agency_id,
  staffing_role_id,
  talent_id,
  note,
  status
)
values (
  '60000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000004',
  'Strong product demo background with excellent reliability score.',
  'recommended'
)
on conflict (agency_id, staffing_role_id, talent_id) do nothing;

insert into public.applications (id, staffing_role_id, talent_id, cover_note, status)
values (
  '50000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000004',
  'Experienced with tech demos and booth lead capture.',
  'completed'
)
on conflict (staffing_role_id, talent_id) do nothing;

insert into public.placements (
  id,
  application_id,
  staffing_role_id,
  talent_id,
  agreed_rate,
  status,
  completed_at
)
values (
  '80000000-0000-0000-0000-000000000001',
  '50000000-0000-0000-0000-000000000001',
  '40000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000004',
  140,
  'completed',
  now()
)
on conflict (application_id) do nothing;

insert into public.placement_reviews (
  id,
  placement_id,
  reviewer_id,
  reviewee_id,
  reviewee_role,
  rating,
  communication_rating,
  professionalism_rating,
  reliability_rating,
  testimonial,
  visibility_status
)
values
  (
    '70000000-0000-0000-0000-000000000001',
    '80000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000003',
    '00000000-0000-0000-0000-000000000004',
    'talent',
    5,
    5,
    5,
    5,
    'Aisha handled demos with confidence, captured clean leads, and stayed sharp through a long expo day.',
    'published'
  ),
  (
    '70000000-0000-0000-0000-000000000002',
    '80000000-0000-0000-0000-000000000001',
    '00000000-0000-0000-0000-000000000004',
    '00000000-0000-0000-0000-000000000003',
    'exhibitor',
    5,
    4,
    5,
    5,
    'The booth team gave clear instructions, paid attention to breaks, and managed visitors professionally.',
    'published'
  )
on conflict (placement_id, reviewer_id, reviewee_id) do nothing;
