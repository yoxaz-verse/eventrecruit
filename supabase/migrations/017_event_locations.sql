alter table public.organizer_events
  add column latitude double precision,
  add column longitude double precision,
  add column location_label text,
  add column location_country_code text;

alter table public.exhibitor_event_submissions
  add column latitude double precision,
  add column longitude double precision,
  add column location_label text,
  add column location_country_code text;

alter table public.organizer_events add constraint organizer_event_location_valid check (
  (latitude is null and longitude is null and location_label is null and location_country_code is null)
  or (latitude between 6 and 37.5 and longitude between 68 and 97.5 and length(trim(location_label)) between 1 and 500 and location_country_code = 'IN')
);
alter table public.exhibitor_event_submissions add constraint exhibitor_event_location_valid check (
  (latitude is null and longitude is null and location_label is null and location_country_code is null)
  or (latitude between 6 and 37.5 and longitude between 68 and 97.5 and length(trim(location_label)) between 1 and 500 and location_country_code = 'IN')
);

create or replace function public.save_organizer_event_with_slots(p_event_id uuid, p_company_id uuid, p_event jsonb, p_slots jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare result uuid; item jsonb; slot_id uuid; saved_count integer; sections text[];
begin
 if jsonb_typeof(p_slots) <> 'array' or jsonb_array_length(p_slots) > 100 then raise exception 'Invalid slots'; end if;
 select coalesce(array_agg(value), '{}') into sections from jsonb_array_elements_text(p_event->'requirement_sections');
 if p_event_id is null then
   insert into public.organizer_events(company_id,title,description,venue,city,location_id,latitude,longitude,location_label,location_country_code,starts_at,ends_at,status,staffing_needs,booking_url,event_type,venue_setting,requirement_sections,requirement_details)
   values (p_company_id,p_event->>'title',p_event->>'description',p_event->>'venue',p_event->>'city',nullif(p_event->>'location_id','')::uuid,nullif(p_event->>'latitude','')::double precision,nullif(p_event->>'longitude','')::double precision,nullif(p_event->>'location_label',''),nullif(p_event->>'location_country_code',''),(p_event->>'starts_at')::date,(p_event->>'ends_at')::date,p_event->>'status',p_event->'staffing_needs',p_event->>'booking_url',p_event->>'event_type',p_event->>'venue_setting',sections,p_event->'requirement_details')
   returning id into result;
 else
   perform 1 from public.organizer_events where id = p_event_id and company_id = p_company_id for update;
   if not found then raise exception 'Event unavailable'; end if;
   update public.organizer_events set title=p_event->>'title',description=p_event->>'description',venue=p_event->>'venue',city=p_event->>'city',location_id=nullif(p_event->>'location_id','')::uuid,latitude=nullif(p_event->>'latitude','')::double precision,longitude=nullif(p_event->>'longitude','')::double precision,location_label=nullif(p_event->>'location_label',''),location_country_code=nullif(p_event->>'location_country_code',''),starts_at=(p_event->>'starts_at')::date,ends_at=(p_event->>'ends_at')::date,status=p_event->>'status',staffing_needs=p_event->'staffing_needs',booking_url=p_event->>'booking_url',event_type=p_event->>'event_type',venue_setting=p_event->>'venue_setting',requirement_sections=sections,requirement_details=p_event->'requirement_details'
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
