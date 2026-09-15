alter table public.organizer_events
 add column event_type text not null default 'other' check (event_type in ('expo','exhibition','activation','fair_festival','conference','other')),
 add column venue_setting text not null default 'other' check (venue_setting in ('convention_centre','mall_retail','hotel_banquet','outdoor_public_ground','store_showroom','office_campus','other')),
 add column requirement_sections text[] not null default '{}',
 add column requirement_details jsonb not null default '{}'::jsonb;

-- Keep existing operational data visible when legacy events are first edited.
update public.organizer_events event set requirement_sections =
 (case when exists(select 1 from public.event_space_offers offer where offer.event_id=event.id and offer.is_active) then array['exhibitor_spaces'] else '{}'::text[] end)
 || (case when exists(select 1 from public.event_booking_slots slot where slot.event_id=event.id and slot.is_active) or event.booking_url<>'' then array['attendee_booking'] else '{}'::text[] end)
 || (case when jsonb_array_length(event.staffing_needs)>0 then array['staffing'] else '{}'::text[] end);

create function public.valid_event_requirements(sections text[], details jsonb) returns boolean
language plpgsql immutable as $$
declare item record;
begin
 if not (sections <@ array['exhibitor_spaces','staffing','attendee_booking','venue_infrastructure','utilities_equipment','compliance_safety','logistics']::text[])
   or cardinality(sections) <> cardinality(array(select distinct unnest(sections)))
   or jsonb_typeof(details) <> 'object' then return false; end if;
 for item in select * from jsonb_each_text(details) loop
   if item.key <> all(array['exhibitor_spaces','staffing','attendee_booking','venue_infrastructure','utilities_equipment','compliance_safety','logistics']) or length(item.value) > 3000 then return false; end if;
 end loop;
 return true;
end; $$;
alter table public.organizer_events add constraint valid_event_requirements check (public.valid_event_requirements(requirement_sections, requirement_details));

create or replace function public.save_organizer_event_with_slots(p_event_id uuid, p_company_id uuid, p_event jsonb, p_slots jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare result uuid; item jsonb; slot_id uuid; saved_count integer; sections text[];
begin
 if jsonb_typeof(p_slots) <> 'array' or jsonb_array_length(p_slots) > 100 then raise exception 'Invalid slots'; end if;
 select coalesce(array_agg(value), '{}') into sections from jsonb_array_elements_text(p_event->'requirement_sections');
 if p_event_id is null then
   insert into public.organizer_events(company_id,title,description,venue,city,starts_at,ends_at,status,staffing_needs,booking_url,event_type,venue_setting,requirement_sections,requirement_details)
   values (p_company_id,p_event->>'title',p_event->>'description',p_event->>'venue',p_event->>'city',(p_event->>'starts_at')::date,(p_event->>'ends_at')::date,p_event->>'status',p_event->'staffing_needs',p_event->>'booking_url',p_event->>'event_type',p_event->>'venue_setting',sections,p_event->'requirement_details')
   returning id into result;
 else
   perform 1 from public.organizer_events where id = p_event_id and company_id = p_company_id for update;
   if not found then raise exception 'Event unavailable'; end if;
   update public.organizer_events set title=p_event->>'title',description=p_event->>'description',venue=p_event->>'venue',city=p_event->>'city',starts_at=(p_event->>'starts_at')::date,ends_at=(p_event->>'ends_at')::date,status=p_event->>'status',staffing_needs=p_event->'staffing_needs',booking_url=p_event->>'booking_url',event_type=p_event->>'event_type',venue_setting=p_event->>'venue_setting',requirement_sections=sections,requirement_details=p_event->'requirement_details'
   where id=p_event_id returning id into result;
 end if;
 update public.event_booking_slots set is_active=false where event_id=result and is_active
   and id not in (select (value->>'id')::uuid from jsonb_array_elements(p_slots) where value->>'id' is not null);
 for item in select value from jsonb_array_elements(p_slots) loop
   slot_id := nullif(item->>'id','')::uuid;
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

create or replace function public.save_organizer_event_with_spaces(p_event_id uuid, p_company_id uuid, p_event jsonb, p_slots jsonb, p_offers jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare result uuid; item jsonb; offer_id uuid; saved_count integer;
begin
 if jsonb_typeof(p_offers) <> 'array' or jsonb_array_length(p_offers) > 30 then raise exception 'Invalid offers'; end if;
 result := public.save_organizer_event_with_slots(p_event_id, p_company_id, p_event, p_slots);
 if p_event->>'status' = 'published' and p_event->'requirement_sections' ? 'exhibitor_spaces' and jsonb_array_length(p_offers) = 0 then
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
