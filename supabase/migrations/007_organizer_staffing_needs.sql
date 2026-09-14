alter table public.organizer_events
  add column staffing_needs jsonb not null default '[]'::jsonb;

create function public.valid_organizer_staffing_needs(needs jsonb) returns boolean
language plpgsql immutable set search_path = public as $$
declare
  item jsonb;
  count_text text;
begin
  if jsonb_typeof(needs) <> 'array' then return false; end if;
  if jsonb_array_length(needs) not between 1 and 30 then return false; end if;
  for item in select value from jsonb_array_elements(needs) loop
    if jsonb_typeof(item) is distinct from 'object'
      or jsonb_typeof(item->'title') is distinct from 'string'
      or coalesce(length(trim(item->>'title')) not between 1 and 160, true)
      or jsonb_typeof(item->'people_needed') is distinct from 'number' then return false; end if;
    count_text := item->>'people_needed';
    if count_text !~ '^[1-9][0-9]*$' or length(count_text) > 6 then return false; end if;
    if count_text::integer > 100000 then return false; end if;
  end loop;
  return true;
end;
$$;

-- Existing published events remain visible; the constraint applies on their next update.
alter table public.organizer_events
  add constraint published_events_require_staffing_needs
  check (status <> 'published' or public.valid_organizer_staffing_needs(staffing_needs)) not valid;
