-- Production auth and XP integrity hardening.
-- Apply after 20260507120000_backend_workflow_integrity.sql.

alter table public.coach_wards add column if not exists participant_id text references public.participants(id) on delete set null;
alter table public.coach_manual_trick_awards add column if not exists participant_id text references public.participants(id) on delete set null;
alter table public.parent_notifications add column if not exists participant_id text references public.participants(id) on delete set null;
alter table public.parent_notifications add column if not exists parent_profile_id text references public.app_profiles(id) on delete set null;

update public.coach_wards ward
set participant_id = participant.id
from public.participants participant
where ward.participant_id is null
  and trim(participant.first_name || ' ' || participant.last_name) = ward.name;

update public.coach_manual_trick_awards award
set participant_id = participant.id
from public.participants participant
where award.participant_id is null
  and trim(participant.first_name || ' ' || participant.last_name) = award.participant_name;

update public.parent_notifications notification
set participant_id = participant.id,
    parent_profile_id = participant.parent_profile_id
from public.participants participant
where notification.participant_id is null
  and trim(participant.first_name || ' ' || participant.last_name) = notification.participant_name;

with duplicates as (
  select ctid, row_number() over (partition by ward_id, trick_id order by created_at asc, id asc) as duplicate_rank
  from public.coach_manual_trick_awards
)
delete from public.coach_manual_trick_awards award
using duplicates
where award.ctid = duplicates.ctid
  and duplicates.duplicate_rank > 1;

drop index if exists coach_manual_trick_awards_ward_trick_idx;
create unique index if not exists coach_manual_trick_awards_ward_trick_uidx
  on public.coach_manual_trick_awards (ward_id, trick_id);

with duplicates as (
  select ctid, row_number() over (partition by participant_id, trick_id order by created_at asc, id asc) as duplicate_rank
  from public.coach_manual_trick_awards
  where participant_id is not null
)
delete from public.coach_manual_trick_awards award
using duplicates
where award.ctid = duplicates.ctid
  and duplicates.duplicate_rank > 1;

create unique index if not exists coach_manual_trick_awards_participant_trick_uidx
  on public.coach_manual_trick_awards (participant_id, trick_id)
  where participant_id is not null;

create or replace function public.teamvys_app_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.app_profiles where id = auth.uid()::text;
$$;

create or replace function public.teamvys_sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  profile_role text := coalesce(new.raw_user_meta_data ->> 'role', 'participant');
  profile_name text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), new.email, 'TeamVYS');
  profile_phone text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '');
  birth_date text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'birthDate', '')), '');
  coach_message text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'coachMessage', '')), '');
  first_name text;
  last_name text;
begin
  if profile_role not in ('participant', 'parent', 'coach', 'admin') then
    profile_role := 'participant';
  end if;

  insert into public.app_profiles (id, role, name, email, phone, bio)
  values (new.id::text, profile_role, profile_name, new.email, profile_phone, case when profile_role = 'coach' then coach_message else null end)
  on conflict (id) do update set
    role = excluded.role,
    name = excluded.name,
    email = excluded.email,
    phone = excluded.phone,
    bio = coalesce(excluded.bio, public.app_profiles.bio);

  if profile_role = 'coach' then
    insert into public.coach_profiles (id, level, xp, next_level_xp, qr_tricks_approved, attendance_logged, bonus_total, assigned_courses)
    values (new.id::text, 1, 0, 500, 0, 0, 0, '{}')
    on conflict (id) do nothing;
  elsif profile_role = 'participant' then
    first_name := split_part(profile_name, ' ', 1);
    last_name := nullif(trim(substr(profile_name, length(first_name) + 1)), '');

    insert into public.participants (id, first_name, last_name, date_of_birth, parent_phone, without_phone, paid_status, active_purchases, level, xp, next_bracelet_xp, bracelet, bracelet_color)
    values (new.id::text, coalesce(nullif(first_name, ''), 'Účastník'), coalesce(last_name, 'TeamVYS'), birth_date, profile_phone, profile_phone is null, 'due', '[]'::jsonb, 1, 0, 600, 'Béžová', '#D8C2A3')
    on conflict (id) do nothing;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_teamvys_sync_auth_user_profile on auth.users;
create trigger trg_teamvys_sync_auth_user_profile
after insert on auth.users
for each row
execute function public.teamvys_sync_auth_user_profile();

create or replace function public.teamvys_sync_manual_trick_award()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  trick_xp integer := 0;
  current_tricks jsonb;
  target_participant_id text;
begin
  select coalesce(xp, 0) into trick_xp from public.coach_tricks where id = new.trick_id;

  target_participant_id := new.participant_id;
  if target_participant_id is null then
    select id into target_participant_id
    from public.participants
    where trim(first_name || ' ' || last_name) = new.participant_name
    limit 1;
  end if;

  if target_participant_id is not null then
    update public.participants
    set xp = coalesce(xp, 0) + trick_xp,
        next_bracelet_xp = case
          when coalesce(xp, 0) + trick_xp < 600 then 600
          when coalesce(xp, 0) + trick_xp < 1400 then 1400
          when coalesce(xp, 0) + trick_xp < 2400 then 2400
          when coalesce(xp, 0) + trick_xp < 3800 then 3800
          else coalesce(xp, 0) + trick_xp
        end,
        bracelet = case
          when coalesce(xp, 0) + trick_xp >= 3800 then 'Černá'
          when coalesce(xp, 0) + trick_xp >= 2400 then 'Tmavě fialová'
          when coalesce(xp, 0) + trick_xp >= 1400 then 'Fialová'
          when coalesce(xp, 0) + trick_xp >= 600 then 'Růžová'
          else 'Béžová'
        end,
        bracelet_color = case
          when coalesce(xp, 0) + trick_xp >= 3800 then '#16151A'
          when coalesce(xp, 0) + trick_xp >= 2400 then '#4C2B86'
          when coalesce(xp, 0) + trick_xp >= 1400 then '#8A62D6'
          when coalesce(xp, 0) + trick_xp >= 600 then '#F5A7C8'
          else '#D8C2A3'
        end
    where id = target_participant_id;
  else
    update public.participants
    set xp = coalesce(xp, 0) + trick_xp
    where trim(first_name || ' ' || last_name) = new.participant_name;
  end if;

  select coalesce(completed_trick_ids, '[]'::jsonb)
  into current_tricks
  from public.coach_wards
  where id = new.ward_id
  for update;

  update public.coach_wards
  set completed_trick_ids = case
    when current_tricks ? new.trick_id then current_tricks
    else current_tricks || to_jsonb(new.trick_id)
  end,
      participant_id = coalesce(participant_id, target_participant_id)
  where id = new.ward_id;

  update public.coach_profiles
  set qr_tricks_approved = qr_tricks_approved + 1,
      xp = xp + trick_xp
  where id = new.coach_id;

  return new;
end;
$$;

create or replace function public.teamvys_prepare_manual_trick_award()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.participant_id is null then
    select id into new.participant_id
    from public.participants
    where trim(first_name || ' ' || last_name) = new.participant_name
    limit 1;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_teamvys_prepare_manual_trick_award on public.coach_manual_trick_awards;
create trigger trg_teamvys_prepare_manual_trick_award
before insert or update on public.coach_manual_trick_awards
for each row
execute function public.teamvys_prepare_manual_trick_award();

drop trigger if exists trg_teamvys_manual_trick_award_progress on public.coach_manual_trick_awards;
create trigger trg_teamvys_manual_trick_award_progress
after insert on public.coach_manual_trick_awards
for each row
execute function public.teamvys_sync_manual_trick_award();

create or replace function public.teamvys_prepare_parent_notification()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.participant_id is null then
    select id, parent_profile_id into new.participant_id, new.parent_profile_id
    from public.participants
    where trim(first_name || ' ' || last_name) = new.participant_name
    limit 1;
  elsif new.parent_profile_id is null then
    select parent_profile_id into new.parent_profile_id
    from public.participants
    where id = new.participant_id
    limit 1;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_teamvys_prepare_parent_notification on public.parent_notifications;
create trigger trg_teamvys_prepare_parent_notification
before insert or update on public.parent_notifications
for each row
execute function public.teamvys_prepare_parent_notification();

create or replace function public.teamvys_claim_qr_trick(p_event_id text)
returns table (status text, trick_title text, xp integer, participant_name text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id text := auth.uid()::text;
  participant_record public.participants%rowtype;
  event_record public.qr_events%rowtype;
  trick_record public.coach_tricks%rowtype;
  ward_record public.coach_wards%rowtype;
  participant_full_name text;
  award_id text;
begin
  if current_user_id is null then
    status := 'not-authenticated';
    return next;
    return;
  end if;

  select * into participant_record from public.participants where id = current_user_id;
  if not found then
    status := 'missing-participant';
    return next;
    return;
  end if;

  participant_full_name := trim(participant_record.first_name || ' ' || participant_record.last_name);

  select * into event_record from public.qr_events where id = trim(p_event_id);
  if not found then
    status := 'not-found';
    return next;
    return;
  end if;

  if event_record.created_at < now() - interval '60 seconds' then
    status := 'expired';
    return next;
    return;
  end if;

  select * into trick_record from public.coach_tricks where id = event_record.trick_id;
  if not found then
    status := 'not-found';
    return next;
    return;
  end if;

  select * into ward_record
  from public.coach_wards
  where participant_id = participant_record.id
     or name = participant_full_name
  order by case when participant_id = participant_record.id then 0 else 1 end
  limit 1;

  if not found then
    status := 'missing-ward';
    trick_title := trick_record.title;
    xp := trick_record.xp;
    participant_name := participant_full_name;
    return next;
    return;
  end if;

  if exists (
    select 1 from public.coach_manual_trick_awards
    where trick_id = trick_record.id
      and (ward_id = ward_record.id or participant_id = participant_record.id)
  ) then
    status := 'already-claimed';
    trick_title := trick_record.title;
    xp := trick_record.xp;
    participant_name := participant_full_name;
    return next;
    return;
  end if;

  award_id := 'qr-award-' || ward_record.id || '-' || trick_record.id;

  begin
    insert into public.coach_manual_trick_awards (id, ward_id, participant_id, participant_name, trick_id, trick_title, coach_id, awarded_at_text)
    values (
      award_id,
      ward_record.id,
      participant_record.id,
      participant_full_name,
      trick_record.id,
      trick_record.title,
      coalesce(event_record.coach_id, 'coach-demo'),
      to_char(now() at time zone 'Europe/Prague', 'DD. MM. YYYY HH24:MI')
    );
  exception when unique_violation then
    status := 'already-claimed';
    trick_title := trick_record.title;
    xp := trick_record.xp;
    participant_name := participant_full_name;
    return next;
    return;
  end;

  status := 'claimed';
  trick_title := trick_record.title;
  xp := trick_record.xp;
  participant_name := participant_full_name;
  return next;
end;
$$;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'app_profiles', 'participants', 'products', 'product_faqs', 'parent_payments', 'parent_purchases',
    'course_documents', 'digital_passes', 'parent_notifications', 'coach_profiles', 'coach_sessions', 'coach_wards',
    'nfc_chip_assignments', 'bracelet_confirmations', 'coach_attendance_records', 'child_attendance_records',
    'coach_tricks', 'qr_events', 'coach_manual_trick_awards', 'coach_leaderboard', 'coach_reward_path', 'coach_payouts',
    'coach_reviews', 'admin_coach_access_keys', 'admin_attendance_adjustments', 'admin_product_drafts',
    'admin_coach_payout_transfers'
  ] loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('drop policy if exists %I on public.%I', table_name || ' prototype all', table_name);
  end loop;
end $$;

drop policy if exists "app_profiles own read" on public.app_profiles;
create policy "app_profiles own read" on public.app_profiles for select
  using (id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "app_profiles own write" on public.app_profiles;
create policy "app_profiles own write" on public.app_profiles for insert
  with check (id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "app_profiles own update" on public.app_profiles;
create policy "app_profiles own update" on public.app_profiles for update
  using (id = auth.uid()::text or public.teamvys_app_role() = 'admin')
  with check (id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "participants scoped read" on public.participants;
create policy "participants scoped read" on public.participants for select
  using (id = auth.uid()::text or parent_profile_id = auth.uid()::text or public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "participants own insert" on public.participants;
create policy "participants own insert" on public.participants for insert
  with check (id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "participants scoped update" on public.participants;
create policy "participants scoped update" on public.participants for update
  using (id = auth.uid()::text or parent_profile_id = auth.uid()::text or public.teamvys_app_role() = 'admin')
  with check (id = auth.uid()::text or parent_profile_id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "products public read" on public.products;
create policy "products public read" on public.products for select using (true);

drop policy if exists "product_faqs public read" on public.product_faqs;
create policy "product_faqs public read" on public.product_faqs for select using (true);

drop policy if exists "coach_tricks authenticated read" on public.coach_tricks;
create policy "coach_tricks authenticated read" on public.coach_tricks for select to authenticated using (true);

drop policy if exists "qr_events authenticated read" on public.qr_events;
create policy "qr_events authenticated read" on public.qr_events for select to authenticated using (true);

drop policy if exists "qr_events coach insert" on public.qr_events;
create policy "qr_events coach insert" on public.qr_events for insert to authenticated
  with check (coach_id = auth.uid()::text and public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "coach_wards coach read" on public.coach_wards;
create policy "coach_wards coach read" on public.coach_wards for select to authenticated
  using (public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "coach_manual_awards scoped read" on public.coach_manual_trick_awards;
create policy "coach_manual_awards scoped read" on public.coach_manual_trick_awards for select to authenticated
  using (participant_id = auth.uid()::text or coach_id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "coach_manual_awards coach write" on public.coach_manual_trick_awards;
create policy "coach_manual_awards coach write" on public.coach_manual_trick_awards for insert to authenticated
  with check (coach_id = auth.uid()::text and public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "coach_profiles scoped read" on public.coach_profiles;
create policy "coach_profiles scoped read" on public.coach_profiles for select to authenticated
  using (id = auth.uid()::text or public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "coach_profiles own update" on public.coach_profiles;
create policy "coach_profiles own update" on public.coach_profiles for update to authenticated
  using (id = auth.uid()::text or public.teamvys_app_role() = 'admin')
  with check (id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "digital_passes scoped read" on public.digital_passes;
create policy "digital_passes scoped read" on public.digital_passes for select to authenticated
  using (
    participant_id = auth.uid()::text
    or exists (select 1 from public.participants where participants.id = digital_passes.participant_id and participants.parent_profile_id = auth.uid()::text)
    or public.teamvys_app_role() in ('coach', 'admin')
  );

drop policy if exists "digital_passes trusted write" on public.digital_passes;
drop policy if exists "digital_passes trusted insert" on public.digital_passes;
create policy "digital_passes trusted insert" on public.digital_passes for insert to authenticated
  with check (
    participant_id = auth.uid()::text
    or exists (select 1 from public.participants where participants.id = digital_passes.participant_id and participants.parent_profile_id = auth.uid()::text)
    or public.teamvys_app_role() in ('coach', 'admin')
  );

drop policy if exists "digital_passes trusted update" on public.digital_passes;
create policy "digital_passes trusted update" on public.digital_passes for update to authenticated
  using (
    participant_id = auth.uid()::text
    or exists (select 1 from public.participants where participants.id = digital_passes.participant_id and participants.parent_profile_id = auth.uid()::text)
    or public.teamvys_app_role() in ('coach', 'admin')
  )
  with check (
    participant_id = auth.uid()::text
    or exists (select 1 from public.participants where participants.id = digital_passes.participant_id and participants.parent_profile_id = auth.uid()::text)
    or public.teamvys_app_role() in ('coach', 'admin')
  );

drop policy if exists "course_documents scoped read" on public.course_documents;
create policy "course_documents scoped read" on public.course_documents for select to authenticated
  using (
    participant_id = auth.uid()::text
    or exists (select 1 from public.participants where participants.id = course_documents.participant_id and participants.parent_profile_id = auth.uid()::text)
    or public.teamvys_app_role() in ('coach', 'admin')
  );

drop policy if exists "course_documents parent write" on public.course_documents;
create policy "course_documents parent write" on public.course_documents for all to authenticated
  using (
    exists (select 1 from public.participants where participants.id = course_documents.participant_id and participants.parent_profile_id = auth.uid()::text)
    or public.teamvys_app_role() = 'admin'
  )
  with check (
    exists (select 1 from public.participants where participants.id = course_documents.participant_id and participants.parent_profile_id = auth.uid()::text)
    or public.teamvys_app_role() = 'admin'
  );

drop policy if exists "parent_payments scoped read" on public.parent_payments;
create policy "parent_payments scoped read" on public.parent_payments for select to authenticated
  using (
    participant_id = auth.uid()::text
    or exists (select 1 from public.participants where participants.id = parent_payments.participant_id and participants.parent_profile_id = auth.uid()::text)
    or public.teamvys_app_role() = 'admin'
  );

drop policy if exists "parent_purchases scoped read" on public.parent_purchases;
create policy "parent_purchases scoped read" on public.parent_purchases for select to authenticated
  using (participant_id = auth.uid()::text or parent_profile_id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "parent_purchases scoped write" on public.parent_purchases;
create policy "parent_purchases scoped write" on public.parent_purchases for all to authenticated
  using (participant_id = auth.uid()::text or parent_profile_id = auth.uid()::text or public.teamvys_app_role() = 'admin')
  with check (participant_id = auth.uid()::text or parent_profile_id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "parent_notifications scoped read" on public.parent_notifications;
create policy "parent_notifications scoped read" on public.parent_notifications for select to authenticated
  using (participant_id = auth.uid()::text or parent_profile_id = auth.uid()::text or public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "parent_notifications coach insert" on public.parent_notifications;
create policy "parent_notifications coach insert" on public.parent_notifications for insert to authenticated
  with check (public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "coach_sessions scoped access" on public.coach_sessions;
create policy "coach_sessions scoped access" on public.coach_sessions for all to authenticated
  using (coach_id = auth.uid()::text or public.teamvys_app_role() = 'admin')
  with check (coach_id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "coach_wards trusted write" on public.coach_wards;
create policy "coach_wards trusted write" on public.coach_wards for update to authenticated
  using (public.teamvys_app_role() in ('coach', 'admin'))
  with check (public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "nfc_assignments coach access" on public.nfc_chip_assignments;
create policy "nfc_assignments coach access" on public.nfc_chip_assignments for all to authenticated
  using (public.teamvys_app_role() in ('coach', 'admin'))
  with check (public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "bracelet_confirmations coach access" on public.bracelet_confirmations;
create policy "bracelet_confirmations coach access" on public.bracelet_confirmations for all to authenticated
  using (public.teamvys_app_role() in ('coach', 'admin'))
  with check (public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "coach_attendance scoped access" on public.coach_attendance_records;
create policy "coach_attendance scoped access" on public.coach_attendance_records for all to authenticated
  using (coach_id = auth.uid()::text or public.teamvys_app_role() = 'admin')
  with check (coach_id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "child_attendance coach access" on public.child_attendance_records;
create policy "child_attendance coach access" on public.child_attendance_records for all to authenticated
  using (public.teamvys_app_role() in ('coach', 'admin'))
  with check (public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "coach_leaderboard coach read" on public.coach_leaderboard;
create policy "coach_leaderboard coach read" on public.coach_leaderboard for select to authenticated
  using (public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "coach_reward_path coach read" on public.coach_reward_path;
create policy "coach_reward_path coach read" on public.coach_reward_path for select to authenticated
  using (public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "coach_payouts scoped read" on public.coach_payouts;
create policy "coach_payouts scoped read" on public.coach_payouts for select to authenticated
  using (coach_id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "coach_reviews scoped read" on public.coach_reviews;
create policy "coach_reviews scoped read" on public.coach_reviews for select to authenticated
  using (coach_id = auth.uid()::text or parent_id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "coach_reviews parent write" on public.coach_reviews;
create policy "coach_reviews parent write" on public.coach_reviews for insert to authenticated
  with check (parent_id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "coach_reviews parent update" on public.coach_reviews;
create policy "coach_reviews parent update" on public.coach_reviews for update to authenticated
  using (parent_id = auth.uid()::text or public.teamvys_app_role() = 'admin')
  with check (parent_id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "admin_coach_access_keys admin access" on public.admin_coach_access_keys;
create policy "admin_coach_access_keys admin access" on public.admin_coach_access_keys for all to authenticated
  using (public.teamvys_app_role() = 'admin')
  with check (public.teamvys_app_role() = 'admin');

drop policy if exists "admin_attendance_adjustments admin access" on public.admin_attendance_adjustments;
create policy "admin_attendance_adjustments admin access" on public.admin_attendance_adjustments for all to authenticated
  using (public.teamvys_app_role() = 'admin')
  with check (public.teamvys_app_role() = 'admin');

drop policy if exists "admin_product_drafts admin access" on public.admin_product_drafts;
create policy "admin_product_drafts admin access" on public.admin_product_drafts for all to authenticated
  using (public.teamvys_app_role() = 'admin')
  with check (public.teamvys_app_role() = 'admin');

drop policy if exists "admin_payout_transfers admin access" on public.admin_coach_payout_transfers;
create policy "admin_payout_transfers admin access" on public.admin_coach_payout_transfers for all to authenticated
  using (public.teamvys_app_role() = 'admin')
  with check (public.teamvys_app_role() = 'admin');