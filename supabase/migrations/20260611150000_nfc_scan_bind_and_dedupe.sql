-- Fixes NFC attendance scanning for coaches:
--   1. A freshly assigned physical bracelet UID never matched the participant's
--      digital pass (which still carried the auto-generated placeholder chip id),
--      so the entry was never decremented. The pass lookup now matches by chip id
--      OR by holder_name + location, and binds the physical chip to the pass on
--      first successful scan (nfc_chip_id is overwritten with the scanned UID).
--   2. Scanning the same child twice on the same training day decremented the
--      permanentka repeatedly. A same-day guard now returns 'already-registered'
--      without touching the pass.

create or replace function public.teamvys_scan_digital_pass(
  p_chip_id text,
  p_location text,
  p_holder_name text default null,
  p_session_id text default null,
  p_method text default 'NFC'
)
returns table (
  status text,
  pass_id text,
  participant_id text,
  holder_name text,
  title text,
  location text,
  nfc_chip_id text,
  total_entries integer,
  used_entries integer,
  last_scan_at text,
  last_scan_place text,
  remaining_entries integer
)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_chip text := upper(regexp_replace(coalesce(p_chip_id, ''), '\s+', '', 'g'));
  pass_record public.digital_passes%rowtype;
  scan_text text := to_char(now() at time zone 'Europe/Prague', 'FMDay DD. FMMonth YYYY HH24:MI');
  today_text text := to_char(now() at time zone 'Europe/Prague', 'DD. MM. YYYY');
  today_key text := to_char(now() at time zone 'Europe/Prague', 'YYYY-MM-DD');
  attendance_id text;
  attendee jsonb;
  current_attendees jsonb;
begin
  if normalized_chip = '' then
    status := 'unknown-chip';
    return next;
    return;
  end if;

  -- Match the pass by the scanned chip id OR by holder name at this location.
  -- A physical bracelet UID will not match the placeholder chip id created at
  -- purchase time, so the holder + location fallback lets the first scan bind it.
  select * into pass_record
  from public.digital_passes pass
  where pass.location = p_location
    and pass.used_entries < pass.total_entries
    and (
      upper(regexp_replace(pass.nfc_chip_id, '\s+', '', 'g')) = normalized_chip
      or (p_holder_name is not null and pass.holder_name = p_holder_name)
    )
  order by
    (case when upper(regexp_replace(pass.nfc_chip_id, '\s+', '', 'g')) = normalized_chip then 0 else 1 end),
    pass.created_at asc
  limit 1
  for update;

  if not found then
    if exists (
      select 1 from public.digital_passes pass
      where pass.location <> p_location
        and pass.used_entries < pass.total_entries
        and (
          upper(regexp_replace(pass.nfc_chip_id, '\s+', '', 'g')) = normalized_chip
          or (p_holder_name is not null and pass.holder_name = p_holder_name)
        )
    ) then
      status := 'wrong-location';
    elsif exists (
      select 1 from public.digital_passes pass
      where pass.location = p_location
        and (
          upper(regexp_replace(pass.nfc_chip_id, '\s+', '', 'g')) = normalized_chip
          or (p_holder_name is not null and pass.holder_name = p_holder_name)
        )
    ) then
      status := 'all-passes-used';
    else
      status := 'no-active-pass';
    end if;
    return next;
    return;
  end if;

  attendance_id := 'children-' || coalesce(p_session_id, 'nfc') || '-' || today_key;

  -- Same-day guard: if this child is already on today's attendance at this
  -- location, do not decrement the permanentka again.
  if exists (
    select 1
    from public.child_attendance_records record,
         jsonb_array_elements(record.attendees) item
    where record.date_text = today_text
      and record.location = p_location
      and item ->> 'name' = pass_record.holder_name
  ) then
    status := 'already-registered';
    pass_id := pass_record.id;
    participant_id := pass_record.participant_id;
    holder_name := pass_record.holder_name;
    title := pass_record.title;
    location := pass_record.location;
    nfc_chip_id := pass_record.nfc_chip_id;
    total_entries := pass_record.total_entries;
    used_entries := pass_record.used_entries;
    last_scan_at := pass_record.last_scan_at;
    last_scan_place := pass_record.last_scan_place;
    remaining_entries := pass_record.total_entries - pass_record.used_entries;
    return next;
    return;
  end if;

  update public.digital_passes
  set used_entries = least(pass_record.used_entries + 1, pass_record.total_entries),
      last_scan_at = scan_text,
      last_scan_place = p_location,
      nfc_chip_id = normalized_chip
  where id = pass_record.id
  returning * into pass_record;

  update public.participants
  set attendance_done = attendance_done + 1,
      attendance_total = greatest(attendance_total, pass_record.total_entries),
      active_course = coalesce(active_course, pass_record.location)
  where id = pass_record.participant_id;

  attendee := jsonb_build_object('name', pass_record.holder_name, 'time', to_char(now() at time zone 'Europe/Prague', 'HH24:MI'), 'method', p_method);

  select coalesce(jsonb_agg(item), '[]'::jsonb)
  into current_attendees
  from public.child_attendance_records record,
       jsonb_array_elements(record.attendees) item
  where record.id = attendance_id
    and item ->> 'name' <> pass_record.holder_name;

  insert into public.child_attendance_records (id, session_id, date_text, location, attendees)
  values (attendance_id, p_session_id, today_text, p_location, jsonb_build_array(attendee))
  on conflict (id) do update set
    session_id = excluded.session_id,
    date_text = excluded.date_text,
    location = excluded.location,
    attendees = coalesce(current_attendees, '[]'::jsonb) || attendee;

  update public.coach_wards
  set entries_left = greatest(pass_record.total_entries - pass_record.used_entries, 0),
      last_attendance = today_text
  where name = pass_record.holder_name
    and p_location = any(locations);

  status := 'updated';
  pass_id := pass_record.id;
  participant_id := pass_record.participant_id;
  holder_name := pass_record.holder_name;
  title := pass_record.title;
  location := pass_record.location;
  nfc_chip_id := pass_record.nfc_chip_id;
  total_entries := pass_record.total_entries;
  used_entries := pass_record.used_entries;
  last_scan_at := pass_record.last_scan_at;
  last_scan_place := pass_record.last_scan_place;
  remaining_entries := pass_record.total_entries - pass_record.used_entries;
  return next;
end;
$$;
