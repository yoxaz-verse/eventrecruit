create function public.valid_event_amenities(selected text[], custom text[])
returns boolean language sql immutable as $$
  select coalesce(cardinality(selected), 0) <= 11
    and coalesce(cardinality(custom), 0) <= 10
    and not exists (
      select 1 from unnest(coalesce(selected, '{}')) value
      where value <> all(array['food','stay','transport','parking','wifi','restrooms','drinking_water','first_aid','wheelchair_accessible','security','charging_points'])
    )
    and cardinality(coalesce(selected, '{}')) = (select count(distinct value) from unnest(coalesce(selected, '{}')) value)
    and not exists (select 1 from unnest(coalesce(custom, '{}')) value where length(trim(value)) not between 1 and 80 or value <> trim(value))
    and cardinality(coalesce(custom, '{}')) = (select count(distinct lower(value)) from unnest(coalesce(custom, '{}')) value);
$$;

alter table public.organizer_events
  add column amenities text[] not null default '{}',
  add column custom_amenities text[] not null default '{}',
  add constraint organizer_event_amenities_valid check (public.valid_event_amenities(amenities, custom_amenities));

alter table public.exhibitor_event_submissions
  add column amenities text[] not null default '{}',
  add column custom_amenities text[] not null default '{}',
  add constraint exhibitor_event_amenities_valid check (public.valid_event_amenities(amenities, custom_amenities));

create or replace function public.save_organizer_event_with_slots(p_event_id uuid, p_company_id uuid, p_event jsonb, p_slots jsonb)
returns uuid language plpgsql security definer set search_path = public as $$
declare result uuid; item jsonb; slot_id uuid; saved_count integer; sections text[]; selected_amenities text[]; custom text[];
begin
 if jsonb_typeof(p_slots) <> 'array' or jsonb_array_length(p_slots) > 100 then raise exception 'Invalid slots'; end if;
 select coalesce(array_agg(value), '{}') into sections from jsonb_array_elements_text(p_event->'requirement_sections');
 select coalesce(array_agg(value), '{}') into selected_amenities from jsonb_array_elements_text(coalesce(p_event->'amenities', '[]'));
 select coalesce(array_agg(value), '{}') into custom from jsonb_array_elements_text(coalesce(p_event->'custom_amenities', '[]'));
 if not public.valid_event_amenities(selected_amenities, custom) then raise exception 'Invalid amenities'; end if;
 if p_event_id is null then
   insert into public.organizer_events(company_id,title,description,venue,city,location_id,latitude,longitude,location_label,location_country_code,starts_at,ends_at,status,staffing_needs,booking_url,event_type,venue_setting,requirement_sections,requirement_details,amenities,custom_amenities)
   values (p_company_id,p_event->>'title',p_event->>'description',p_event->>'venue',p_event->>'city',nullif(p_event->>'location_id','')::uuid,nullif(p_event->>'latitude','')::double precision,nullif(p_event->>'longitude','')::double precision,nullif(p_event->>'location_label',''),nullif(p_event->>'location_country_code',''),(p_event->>'starts_at')::date,(p_event->>'ends_at')::date,p_event->>'status',p_event->'staffing_needs',p_event->>'booking_url',p_event->>'event_type',p_event->>'venue_setting',sections,p_event->'requirement_details',selected_amenities,custom)
   returning id into result;
 else
   perform 1 from public.organizer_events where id = p_event_id and company_id = p_company_id for update;
   if not found then raise exception 'Event unavailable'; end if;
   update public.organizer_events set title=p_event->>'title',description=p_event->>'description',venue=p_event->>'venue',city=p_event->>'city',location_id=nullif(p_event->>'location_id','')::uuid,latitude=nullif(p_event->>'latitude','')::double precision,longitude=nullif(p_event->>'longitude','')::double precision,location_label=nullif(p_event->>'location_label',''),location_country_code=nullif(p_event->>'location_country_code',''),starts_at=(p_event->>'starts_at')::date,ends_at=(p_event->>'ends_at')::date,status=p_event->>'status',staffing_needs=p_event->'staffing_needs',booking_url=p_event->>'booking_url',event_type=p_event->>'event_type',venue_setting=p_event->>'venue_setting',requirement_sections=sections,requirement_details=p_event->'requirement_details',amenities=selected_amenities,custom_amenities=custom
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
