alter table public.organizer_events
 add column pricing_chart_path text,
 add column floor_layout_path text;

create table public.event_space_offers (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.organizer_events(id) on delete cascade,
 name text not null check (length(trim(name)) between 1 and 160),
 description text not null default '' check (length(description) <= 3000),
 inclusions text not null default '' check (length(inclusions) <= 3000),
 area_sqft numeric(12,2) check (area_sqft > 0 and area_sqft <= 1000000),
 unit_count integer check (unit_count between 1 and 100000),
 price_type text not null check (price_type in ('fixed','per_sqft','quote')),
 price_inr integer,
 is_active boolean not null default true,
 position integer not null default 0,
 check ((price_type = 'quote' and price_inr is null) or (price_type <> 'quote' and price_inr between 1 and 1000000000))
);
create index event_space_offers_event on public.event_space_offers(event_id, position);
alter table public.event_space_offers enable row level security;
revoke all on public.event_space_offers from public, anon, authenticated;
grant select, insert, update, delete on public.event_space_offers to service_role;

create table public.event_space_inquiries (
 id uuid primary key default gen_random_uuid(),
 event_id uuid not null references public.organizer_events(id),
 offer_id uuid not null references public.event_space_offers(id),
 exhibitor_id uuid not null references public.profiles(id),
 requested_area_sqft numeric(12,2) check (requested_area_sqft > 0 and requested_area_sqft <= 1000000),
 requested_units integer check (requested_units between 1 and 100000),
 message text not null check (length(trim(message)) between 1 and 3000),
 status text not null default 'new' check (status in ('new','contacted','accepted','declined')),
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create index event_space_inquiries_event on public.event_space_inquiries(event_id, created_at desc);
create index event_space_inquiries_exhibitor on public.event_space_inquiries(exhibitor_id, created_at desc);
alter table public.event_space_inquiries enable row level security;
revoke all on public.event_space_inquiries from public, anon, authenticated;
grant select, insert, update on public.event_space_inquiries to service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('event-space-assets', 'event-space-assets', false, 5242880, array['application/pdf','image/png','image/jpeg','image/webp'])
on conflict (id) do nothing;

create function public.save_organizer_event_with_spaces(p_event_id uuid, p_company_id uuid, p_event jsonb, p_slots jsonb, p_offers jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare result uuid; item jsonb; offer_id uuid; saved_count integer; legacy_published boolean := false;
begin
 if jsonb_typeof(p_offers) <> 'array' or jsonb_array_length(p_offers) > 30 then raise exception 'Invalid offers'; end if;
 if p_event_id is not null then
   select published_at is not null into legacy_published from public.organizer_events where id=p_event_id and company_id=p_company_id;
 end if;
 result := public.save_organizer_event_with_slots(p_event_id, p_company_id, p_event, p_slots);
 if p_event->>'status' = 'published' and jsonb_array_length(p_offers) = 0 and
   (not coalesce(legacy_published,false) or exists(select 1 from public.event_space_offers where event_id=result)) then
   raise exception 'Published exhibitor spaces need an offer';
 end if;
 update public.event_space_offers set is_active=false where event_id=result and is_active
   and id not in (select (value->>'id')::uuid from jsonb_array_elements(p_offers) where value->>'id' is not null);
 for item in select value from jsonb_array_elements(p_offers) loop
   offer_id := nullif(item->>'id','')::uuid;
   if offer_id is null then
     insert into public.event_space_offers(event_id,name,description,inclusions,area_sqft,unit_count,price_type,price_inr,position)
     values(result,item->>'name',item->>'description',item->>'inclusions',nullif(item->>'area_sqft','')::numeric,nullif(item->>'unit_count','')::integer,item->>'price_type',nullif(item->>'price_inr','')::integer,(item->>'position')::integer);
   else
     update public.event_space_offers set name=item->>'name',description=item->>'description',inclusions=item->>'inclusions',area_sqft=nullif(item->>'area_sqft','')::numeric,unit_count=nullif(item->>'unit_count','')::integer,price_type=item->>'price_type',price_inr=nullif(item->>'price_inr','')::integer,position=(item->>'position')::integer,is_active=true
     where id=offer_id and event_id=result;
     get diagnostics saved_count = row_count;
     if saved_count <> 1 then raise exception 'Invalid offer'; end if;
   end if;
 end loop;
 return result;
end; $$;
revoke all on function public.save_organizer_event_with_spaces(uuid,uuid,jsonb,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.save_organizer_event_with_spaces(uuid,uuid,jsonb,jsonb,jsonb) to service_role;
