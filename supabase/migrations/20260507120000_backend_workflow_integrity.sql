-- Backend workflow integrity for purchases, attendance scans, trick rewards, and coach payouts.

alter table public.digital_passes add column if not exists product_id text;
alter table public.digital_passes add column if not exists purchase_id text;
alter table public.digital_passes add column if not exists pass_kind text not null default 'course';
alter table public.digital_passes add column if not exists expires_at text;

create index if not exists digital_passes_chip_location_idx on public.digital_passes (nfc_chip_id, location);
create index if not exists parent_purchases_paid_product_idx on public.parent_purchases (product_id, status);
create index if not exists parent_purchases_participant_idx on public.parent_purchases (participant_id, created_at desc);
create index if not exists coach_attendance_records_coach_created_idx on public.coach_attendance_records (coach_id, created_at);
create index if not exists admin_attendance_adjustments_coach_created_idx on public.admin_attendance_adjustments (coach_id, created_at);
create index if not exists coach_manual_trick_awards_ward_trick_idx on public.coach_manual_trick_awards (ward_id, trick_id);

create or replace function public.teamvys_sync_paid_purchase_side_effects()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  product_record public.products%rowtype;
  purchase_summary jsonb;
  paid_count integer;
  total_entries integer;
  pass_prefix text;
begin
  if new.status <> 'Zaplaceno' then
    return new;
  end if;

  select * into product_record
  from public.products
  where id = new.product_id;

  if not found then
    return new;
  end if;

  select count(*)::integer into paid_count
  from public.parent_purchases
  where product_id = new.product_id
    and status = 'Zaplaceno';

  update public.products
  set capacity_current = paid_count
  where id = new.product_id;

  select coalesce(jsonb_agg(jsonb_build_object(
    'purchaseId', purchase.id,
    'productId', purchase.product_id,
    'type', purchase.type,
    'title', purchase.title,
    'status', case when purchase.status = 'Zaplaceno' then 'Aktivní' else purchase.status end,
    'place', purchase.place,
    'paidAt', purchase.paid_at
  ) order by purchase.created_at desc), '[]'::jsonb)
  into purchase_summary
  from public.parent_purchases purchase
  where purchase.participant_id = new.participant_id
    and purchase.status = 'Zaplaceno';

  update public.participants
  set active_course = case when product_record.type = 'Kroužek' then product_record.place else coalesce(active_course, product_record.place) end,
      next_training = coalesce(product_record.event_date, product_record.expires_at, next_training),
      paid_status = 'paid',
      active_purchases = purchase_summary
  where id = new.participant_id;

  total_entries := greatest(coalesce(product_record.entries_total, case when product_record.type = 'Kroužek' then 10 else 1 end), 1);
  pass_prefix := case when product_record.type = 'Kroužek' then 'NFC' else 'QR' end;

  insert into public.digital_passes (
    id,
    participant_id,
    holder_name,
    title,
    location,
    nfc_chip_id,
    total_entries,
    used_entries,
    last_scan_at,
    last_scan_place,
    product_id,
    purchase_id,
    pass_kind,
    expires_at
  ) values (
    'pass-' || new.id,
    new.participant_id,
    new.participant_name,
    case when product_record.type = 'Kroužek' then 'Permanentka ' || total_entries || ' vstupů' else product_record.title || ' · ticket' end,
    product_record.place,
    pass_prefix || '-' || upper(substr(regexp_replace(new.participant_id, '[^a-zA-Z0-9]', '', 'g'), 1, 8)) || '-' || upper(substr(regexp_replace(new.product_id, '[^a-zA-Z0-9]', '', 'g'), 1, 8)),
    total_entries,
    0,
    null,
    product_record.place,
    product_record.id,
    new.id,
    case when product_record.type = 'Kroužek' then 'course' when product_record.type = 'Tábor' then 'camp' else 'workshop' end,
    product_record.expires_at
  )
  on conflict (id) do update set
    participant_id = excluded.participant_id,
    holder_name = excluded.holder_name,
    title = excluded.title,
    location = excluded.location,
    total_entries = excluded.total_entries,
    last_scan_place = excluded.last_scan_place,
    product_id = excluded.product_id,
    purchase_id = excluded.purchase_id,
    pass_kind = excluded.pass_kind,
    expires_at = excluded.expires_at;

  insert into public.parent_payments (id, participant_id, participant_name, title, amount, due_date, status, stripe_ready)
  values ('payment-' || new.id, new.participant_id, new.participant_name, new.title, new.amount, new.paid_at, 'paid', true)
  on conflict (id) do update set
    participant_id = excluded.participant_id,
    participant_name = excluded.participant_name,
    title = excluded.title,
    amount = excluded.amount,
    due_date = excluded.due_date,
    status = excluded.status,
    stripe_ready = excluded.stripe_ready;

  return new;
end;
$$;

drop trigger if exists trg_teamvys_paid_purchase_side_effects on public.parent_purchases;
create trigger trg_teamvys_paid_purchase_side_effects
after insert or update of status, participant_id, product_id, amount, paid_at on public.parent_purchases
for each row
execute function public.teamvys_sync_paid_purchase_side_effects();

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

  select * into pass_record
  from public.digital_passes pass
  where upper(regexp_replace(pass.nfc_chip_id, '\s+', '', 'g')) = normalized_chip
    and pass.location = p_location
    and pass.used_entries < pass.total_entries
    and (p_holder_name is null or pass.holder_name = p_holder_name)
  order by pass.created_at asc
  limit 1
  for update;

  if not found then
    if exists (
      select 1 from public.digital_passes pass
      where upper(regexp_replace(pass.nfc_chip_id, '\s+', '', 'g')) = normalized_chip
        and pass.location <> p_location
        and pass.used_entries < pass.total_entries
    ) then
      status := 'wrong-location';
    elsif exists (
      select 1 from public.digital_passes pass
      where upper(regexp_replace(pass.nfc_chip_id, '\s+', '', 'g')) = normalized_chip
        and pass.location = p_location
    ) then
      status := 'all-passes-used';
    else
      status := 'no-active-pass';
    end if;
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

  attendance_id := 'children-' || coalesce(p_session_id, 'nfc') || '-' || today_key;
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

create or replace function public.teamvys_sync_manual_trick_award()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  trick_xp integer := 0;
  current_tricks jsonb;
begin
  select coalesce(xp, 0) into trick_xp from public.coach_tricks where id = new.trick_id;

  update public.participants
  set xp = xp + trick_xp
  where trim(first_name || ' ' || last_name) = new.participant_name;

  select coalesce(completed_trick_ids, '[]'::jsonb)
  into current_tricks
  from public.coach_wards
  where id = new.ward_id
  for update;

  update public.coach_wards
  set completed_trick_ids = case
    when current_tricks ? new.trick_id then current_tricks
    else current_tricks || to_jsonb(new.trick_id)
  end
  where id = new.ward_id;

  update public.coach_profiles
  set qr_tricks_approved = qr_tricks_approved + 1,
      xp = xp + trick_xp
  where id = new.coach_id;

  return new;
end;
$$;

drop trigger if exists trg_teamvys_manual_trick_award_progress on public.coach_manual_trick_awards;
create trigger trg_teamvys_manual_trick_award_progress
after insert on public.coach_manual_trick_awards
for each row
execute function public.teamvys_sync_manual_trick_award();

create or replace function public.teamvys_recalculate_coach_payout(p_coach_id text)
returns public.coach_payouts
language plpgsql
security definer
set search_path = public
as $$
declare
  payout public.coach_payouts%rowtype;
  logged_hours numeric := 0;
  base_amount integer := 0;
  default_rate integer := 500;
begin
  select coalesce(sum(duration_hours), 0), coalesce(sum(amount), 0)::integer
  into logged_hours, base_amount
  from (
    select duration_hours, amount
    from public.coach_attendance_records
    where coach_id = p_coach_id
    union all
    select duration_hours, amount
    from public.admin_attendance_adjustments
    where coach_id = p_coach_id
  ) payout_source;

  select coalesce(hourly_rate, default_rate), approved_bonuses, pending_bonuses, next_payout, status
  into default_rate, payout.approved_bonuses, payout.pending_bonuses, payout.next_payout, payout.status
  from public.coach_payouts
  where coach_id = p_coach_id
  limit 1;

  payout.id := 'payout-' || p_coach_id || '-current';
  payout.coach_id := p_coach_id;
  payout.hourly_rate := coalesce(default_rate, 500);
  payout.logged_hours := logged_hours;
  payout.base_amount := base_amount;
  payout.approved_bonuses := coalesce(payout.approved_bonuses, 0);
  payout.pending_bonuses := coalesce(payout.pending_bonuses, 0);
  payout.next_payout := coalesce(payout.next_payout, 'Další výplatní termín');
  payout.status := coalesce(payout.status, 'Připraveno k výplatě');
  payout.updated_at := now();

  insert into public.coach_payouts as target (id, coach_id, hourly_rate, logged_hours, base_amount, approved_bonuses, pending_bonuses, next_payout, status, updated_at)
  values (payout.id, payout.coach_id, payout.hourly_rate, payout.logged_hours, payout.base_amount, payout.approved_bonuses, payout.pending_bonuses, payout.next_payout, payout.status, payout.updated_at)
  on conflict (id) do update set
    hourly_rate = excluded.hourly_rate,
    logged_hours = excluded.logged_hours,
    base_amount = excluded.base_amount,
    approved_bonuses = excluded.approved_bonuses,
    pending_bonuses = excluded.pending_bonuses,
    next_payout = excluded.next_payout,
    status = excluded.status,
    updated_at = excluded.updated_at
  returning * into payout;

  return payout;
end;
$$;

create or replace function public.teamvys_recalculate_coach_payout_trigger()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_coach_id text;
begin
  if tg_op = 'DELETE' then
    target_coach_id := old.coach_id;
    perform public.teamvys_recalculate_coach_payout(target_coach_id);
    return old;
  end if;
  target_coach_id := new.coach_id;
  perform public.teamvys_recalculate_coach_payout(target_coach_id);
  return new;
end;
$$;

drop trigger if exists trg_teamvys_recalculate_coach_payout on public.coach_attendance_records;
create trigger trg_teamvys_recalculate_coach_payout
after insert or update or delete on public.coach_attendance_records
for each row
execute function public.teamvys_recalculate_coach_payout_trigger();

drop trigger if exists trg_teamvys_recalculate_adjusted_coach_payout on public.admin_attendance_adjustments;
create trigger trg_teamvys_recalculate_adjusted_coach_payout
after insert or update or delete on public.admin_attendance_adjustments
for each row
execute function public.teamvys_recalculate_coach_payout_trigger();
