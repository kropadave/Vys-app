-- Manual attendance must also credit the kid with klubíčka (coins).
--
-- Coins are derived from participants.attendance_done (pending = attendance_done
-- - converted_attendance). The NFC scan RPC (teamvys_scan_digital_pass) already
-- increments attendance_done, but a coach who writes attendance by hand only
-- upserted child_attendance_records, so manually-recorded children never earned
-- coins. This RPC mirrors the NFC path for the coins side: it increments
-- attendance_done (with a same-day guard so re-entry doesn't double count) and
-- writes the attendance row server-side. It intentionally does NOT touch the
-- digital pass / permanentka — a manual entry means the child had no chip.

create or replace function public.teamvys_record_manual_attendance(
  p_participant_name text,
  p_location text,
  p_session_id text default null
)
returns table (
  status text,
  participant_id text,
  attendance_done integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  participant_record public.participants%rowtype;
  today_text text := to_char(now() at time zone 'Europe/Prague', 'DD. MM. YYYY');
  today_key text := to_char(now() at time zone 'Europe/Prague', 'YYYY-MM-DD');
  normalized_name text := lower(btrim(regexp_replace(coalesce(p_participant_name, ''), '\s+', ' ', 'g')));
  attendance_id text;
  attendee jsonb;
  current_attendees jsonb;
begin
  if normalized_name = '' then
    status := 'unknown';
    return next;
    return;
  end if;

  -- Match by full name (diacritics-insensitive enough via lower/trim), preferring
  -- a participant whose active_course matches the training location.
  select * into participant_record
  from public.participants p
  where lower(btrim(regexp_replace(coalesce(p.first_name, '') || ' ' || coalesce(p.last_name, ''), '\s+', ' ', 'g'))) = normalized_name
  order by (case when p.active_course = p_location then 0 else 1 end), p.created_at asc
  limit 1
  for update;

  if not found then
    status := 'unknown';
    return next;
    return;
  end if;

  attendance_id := 'children-' || coalesce(p_session_id, 'manual') || '-' || today_key;

  -- Same-day guard: if this child is already on today's attendance at this
  -- location, do not increment attendance_done again.
  if exists (
    select 1
    from public.child_attendance_records record,
         jsonb_array_elements(record.attendees) item
    where record.date_text = today_text
      and record.location = p_location
      and item ->> 'name' = p_participant_name
  ) then
    status := 'already-registered';
    participant_id := participant_record.id;
    attendance_done := participant_record.attendance_done;
    return next;
    return;
  end if;

  update public.participants
  set attendance_done = attendance_done + 1,
      active_course = coalesce(active_course, p_location)
  where id = participant_record.id
  returning participants.attendance_done into attendance_done;

  attendee := jsonb_build_object(
    'name', p_participant_name,
    'time', to_char(now() at time zone 'Europe/Prague', 'HH24:MI'),
    'method', 'Ručně'
  );

  select coalesce(jsonb_agg(item), '[]'::jsonb)
  into current_attendees
  from public.child_attendance_records record,
       jsonb_array_elements(record.attendees) item
  where record.id = attendance_id
    and item ->> 'name' <> p_participant_name;

  insert into public.child_attendance_records (id, session_id, date_text, location, attendees)
  values (attendance_id, p_session_id, today_text, p_location, jsonb_build_array(attendee))
  on conflict (id) do update set
    session_id = excluded.session_id,
    date_text = excluded.date_text,
    location = excluded.location,
    attendees = coalesce(current_attendees, '[]'::jsonb) || attendee;

  status := 'registered';
  participant_id := participant_record.id;
  return next;
end;
$$;

grant execute on function public.teamvys_record_manual_attendance(text, text, text) to anon, authenticated, service_role;
