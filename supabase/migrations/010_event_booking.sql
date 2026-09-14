alter table public.organizer_events add column booking_url text not null default '' check (booking_url = '' or booking_url ~ '^https://');
alter table public.organizer_events drop constraint published_events_require_staffing_needs;
alter table public.organizer_events add constraint organizer_staffing_needs_optional check (staffing_needs = '[]'::jsonb or public.valid_organizer_staffing_needs(staffing_needs)) not valid;

create table public.event_booking_slots (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.organizer_events(id) on delete cascade,
 slot_date date not null,
 start_time time not null,
 end_time time not null,
 capacity integer not null check (capacity between 1 and 100000),
 booked_count integer not null default 0 check (booked_count >= 0 and booked_count <= capacity),
 is_active boolean not null default true,
 check (end_time > start_time)
);
create index event_booking_slots_event on public.event_booking_slots(event_id, slot_date, start_time);
create unique index event_booking_slots_unique_active on public.event_booking_slots(event_id, slot_date, start_time, end_time) where is_active;
create table public.event_bookings (
 id uuid primary key default gen_random_uuid(),
 slot_id uuid not null references public.event_booking_slots(id),
 guest_name text not null check (length(trim(guest_name)) between 1 and 160),
 guest_email text not null,
 email_normalized text not null,
 cancel_token_hash text not null unique,
 cancelled_at timestamptz,
 email_sent_at timestamptz,
 created_at timestamptz not null default now()
);
create unique index one_active_booking_per_email_slot on public.event_bookings(slot_id, email_normalized) where cancelled_at is null;
create index event_bookings_slot on public.event_bookings(slot_id);
alter table public.event_booking_slots enable row level security;
alter table public.event_bookings enable row level security;
revoke all on public.event_booking_slots, public.event_bookings from public, anon, authenticated;
grant select, insert, update, delete on public.event_booking_slots, public.event_bookings to service_role;

create function public.reserve_event_slot(p_slot_id uuid, p_name text, p_email text, p_token_hash text)
returns uuid language plpgsql security definer set search_path = public as $$
declare s public.event_booking_slots%rowtype; e public.organizer_events%rowtype; result uuid;
begin
 select * into s from public.event_booking_slots where id = p_slot_id for update;
 if not found then raise exception 'Slot unavailable'; end if;
 select * into e from public.organizer_events where id = s.event_id;
 if not s.is_active or e.status <> 'published' or e.ends_at < (now() at time zone 'Asia/Kolkata')::date
   or (s.slot_date + s.start_time) <= (now() at time zone 'Asia/Kolkata')
   or s.slot_date < e.starts_at or s.slot_date > e.ends_at then raise exception 'Slot unavailable'; end if;
 if s.booked_count >= s.capacity then raise exception 'Slot full'; end if;
 if exists(select 1 from public.event_bookings where slot_id = p_slot_id and email_normalized = lower(trim(p_email)) and cancelled_at is null) then raise exception 'Already booked'; end if;
 insert into public.event_bookings(slot_id,guest_name,guest_email,email_normalized,cancel_token_hash)
 values (p_slot_id,trim(p_name),trim(p_email),lower(trim(p_email)),p_token_hash) returning id into result;
 update public.event_booking_slots set booked_count = booked_count + 1 where id = p_slot_id;
 return result;
end; $$;
create function public.cancel_event_booking(p_token_hash text)
returns boolean language plpgsql security definer set search_path = public as $$
declare b public.event_bookings%rowtype;
begin
 select * into b from public.event_bookings where cancel_token_hash = p_token_hash;
 if not found or b.cancelled_at is not null then return false; end if;
 perform 1 from public.event_booking_slots where id = b.slot_id for update;
 select * into b from public.event_bookings where id = b.id for update;
 if b.cancelled_at is not null then return false; end if;
 update public.event_bookings set cancelled_at = now() where id = b.id;
 update public.event_booking_slots set booked_count = booked_count - 1 where id = b.slot_id;
 return true;
end; $$;
revoke all on function public.reserve_event_slot(uuid,text,text,text), public.cancel_event_booking(text) from public, anon, authenticated;
grant execute on function public.reserve_event_slot(uuid,text,text,text), public.cancel_event_booking(text) to service_role;

create function public.guard_booked_slot() returns trigger language plpgsql as $$
begin
 if TG_OP = 'DELETE' and exists(select 1 from public.event_bookings where slot_id = old.id) then raise exception 'Slots with booking history cannot be deleted'; end if;
 if TG_OP = 'UPDATE' and exists(select 1 from public.event_bookings where slot_id = old.id) and
   (new.event_id <> old.event_id or new.slot_date <> old.slot_date or new.start_time <> old.start_time or new.end_time <> old.end_time)
 then raise exception 'Booked slots cannot be rescheduled'; end if;
 if TG_OP = 'DELETE' then return old; end if;
 return new;
end; $$;
create trigger guard_booked_slot before update or delete on public.event_booking_slots for each row execute function public.guard_booked_slot();

create function public.save_organizer_event_with_slots(p_event_id uuid, p_company_id uuid, p_event jsonb, p_slots jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare result uuid; item jsonb; slot_id uuid; saved_count integer;
begin
 if jsonb_typeof(p_slots) <> 'array' or jsonb_array_length(p_slots) > 100 then raise exception 'Invalid slots'; end if;
 if p_event_id is null then
   insert into public.organizer_events(company_id,title,description,venue,city,starts_at,ends_at,status,staffing_needs,booking_url)
   values (p_company_id,p_event->>'title',p_event->>'description',p_event->>'venue',p_event->>'city',(p_event->>'starts_at')::date,(p_event->>'ends_at')::date,p_event->>'status',p_event->'staffing_needs',p_event->>'booking_url')
   returning id into result;
 else
   perform 1 from public.organizer_events where id = p_event_id and company_id = p_company_id for update;
   if not found then raise exception 'Event unavailable'; end if;
   update public.organizer_events set title=p_event->>'title',description=p_event->>'description',venue=p_event->>'venue',city=p_event->>'city',starts_at=(p_event->>'starts_at')::date,ends_at=(p_event->>'ends_at')::date,status=p_event->>'status',staffing_needs=p_event->'staffing_needs',booking_url=p_event->>'booking_url'
   where id=p_event_id returning id into result;
 end if;
 update public.event_booking_slots set is_active=false where event_id=result and is_active
   and id not in (select (value->>'id')::uuid from jsonb_array_elements(p_slots) where value->>'id' is not null);
 for item in select value from jsonb_array_elements(p_slots) loop
   slot_id := (item->>'id')::uuid;
   if slot_id is null then
     insert into public.event_booking_slots(event_id,slot_date,start_time,end_time,capacity)
     values (result,(item->>'slot_date')::date,(item->>'start_time')::time,(item->>'end_time')::time,(item->>'capacity')::integer);
   else
     update public.event_booking_slots set slot_date=(item->>'slot_date')::date,start_time=(item->>'start_time')::time,end_time=(item->>'end_time')::time,capacity=(item->>'capacity')::integer,is_active=true
     where id=slot_id and event_id=result;
     get diagnostics saved_count = row_count;
     if saved_count <> 1 then raise exception 'Invalid slot'; end if;
   end if;
 end loop;
 return result;
end; $$;
revoke all on function public.save_organizer_event_with_slots(uuid,uuid,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.save_organizer_event_with_slots(uuid,uuid,jsonb,jsonb) to service_role;
