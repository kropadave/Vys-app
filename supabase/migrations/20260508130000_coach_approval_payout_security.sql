-- Coach approval, payout details and admin account containment.
-- Apply after 20260508120000_production_auth_xp_security.sql.

alter table public.coach_profiles add column if not exists approval_status text not null default 'pending';
alter table public.coach_profiles add column if not exists approval_requested_at timestamptz not null default now();
alter table public.coach_profiles add column if not exists approved_at timestamptz;
alter table public.coach_profiles add column if not exists approved_by text references public.app_profiles(id) on delete set null;
alter table public.coach_profiles add column if not exists rejected_at timestamptz;
alter table public.coach_profiles add column if not exists rejected_by text references public.app_profiles(id) on delete set null;
alter table public.coach_profiles add column if not exists rejection_reason text;
alter table public.coach_profiles add column if not exists bank_account text;
alter table public.coach_profiles add column if not exists iban text;
alter table public.coach_profiles add column if not exists payout_account_holder text;
alter table public.coach_profiles add column if not exists payout_note text;
alter table public.coach_profiles add column if not exists payout_details_updated_at timestamptz;

alter table if exists public.participants add column if not exists parent_profile_id text references public.app_profiles(id) on delete set null;
alter table if exists public.digital_passes add column if not exists participant_id text references public.participants(id) on delete cascade;
alter table if exists public.course_documents add column if not exists participant_id text references public.participants(id) on delete cascade;
alter table if exists public.parent_notifications add column if not exists participant_id text references public.participants(id) on delete set null;
alter table if exists public.parent_notifications add column if not exists parent_profile_id text references public.app_profiles(id) on delete set null;

do $$
begin
  alter table public.coach_profiles drop constraint if exists coach_profiles_approval_status_check;
  alter table public.coach_profiles add constraint coach_profiles_approval_status_check
    check (approval_status in ('pending', 'approved', 'rejected', 'suspended'));
end $$;

create index if not exists coach_profiles_approval_status_idx on public.coach_profiles (approval_status);

create or replace function public.teamvys_app_role()
returns text
language sql
security definer
set search_path = public
as $$
  select role from public.app_profiles where id = auth.uid()::text;
$$;

create table if not exists public.admin_account_invites (
  email text primary key,
  invited_by text references public.app_profiles(id) on delete set null,
  invited_at timestamptz not null default now(),
  used_by text references public.app_profiles(id) on delete set null,
  used_at timestamptz,
  active boolean not null default true,
  note text not null default ''
);

insert into public.admin_account_invites (email, invited_by, used_by, used_at, note)
select lower(trim(email)), id, id, now(), 'Existing admin before admin invite enforcement.'
from public.app_profiles
where role = 'admin'
  and email is not null
  and trim(email) <> ''
on conflict (email) do update set
  used_by = coalesce(public.admin_account_invites.used_by, excluded.used_by),
  used_at = coalesce(public.admin_account_invites.used_at, excluded.used_at),
  active = true;

create or replace function public.teamvys_is_admin_email_allowed(p_email text, p_user_id text default null)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_account_invites invite
    where invite.email = lower(trim(coalesce(p_email, '')))
      and invite.active = true
      and (invite.used_by is null or invite.used_by = p_user_id)
  );
$$;

create or replace function public.teamvys_is_approved_coach(p_user_id text default auth.uid()::text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.app_profiles profile
    join public.coach_profiles coach on coach.id = profile.id
    where profile.id = p_user_id
      and profile.role = 'coach'
      and coach.approval_status = 'approved'
  );
$$;

create or replace function public.teamvys_is_staff()
returns boolean
language sql
security definer
set search_path = public
as $$
  select public.teamvys_app_role() = 'admin' or public.teamvys_is_approved_coach(auth.uid()::text);
$$;

create or replace function public.teamvys_sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role text := coalesce(new.raw_user_meta_data ->> 'role', 'participant');
  profile_role text := requested_role;
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

  if profile_role = 'admin' then
    if public.teamvys_is_admin_email_allowed(new.email, new.id::text) then
      update public.admin_account_invites
      set used_by = coalesce(used_by, new.id::text),
          used_at = coalesce(used_at, now())
      where email = lower(trim(coalesce(new.email, '')))
        and active = true;
    else
      profile_role := 'parent';
    end if;
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
    insert into public.coach_profiles (id, level, xp, next_level_xp, qr_tricks_approved, attendance_logged, bonus_total, assigned_courses, approval_status, approval_requested_at)
    values (new.id::text, 1, 0, 500, 0, 0, 0, '{}', 'pending', now())
    on conflict (id) do update set
      approval_status = case when public.coach_profiles.approval_status = 'approved' then public.coach_profiles.approval_status else 'pending' end,
      approval_requested_at = coalesce(public.coach_profiles.approval_requested_at, now());
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

create or replace function public.teamvys_protect_app_profile_role()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  actor_id text := auth.uid()::text;
  actor_is_admin boolean := false;
  normalized_email text := lower(trim(coalesce(new.email, case when tg_op = 'UPDATE' then old.email else null end, '')));
begin
  if actor_id is null then
    return new;
  end if;

  actor_is_admin := public.teamvys_app_role() = 'admin';

  if new.id <> actor_id and not actor_is_admin then
    raise exception 'Cannot edit another app profile.' using errcode = '42501';
  end if;

  if tg_op = 'INSERT' then
    if new.role = 'admin' then
      if public.teamvys_is_admin_email_allowed(normalized_email, new.id) then
        update public.admin_account_invites
        set used_by = coalesce(used_by, new.id),
            used_at = coalesce(used_at, now())
        where email = normalized_email
          and active = true;
      else
        new.role := 'parent';
      end if;
    end if;

    return new;
  end if;

  if not actor_is_admin then
    new.role := old.role;
    return new;
  end if;

  if new.role = 'admin' and old.role is distinct from 'admin' then
    if not public.teamvys_is_admin_email_allowed(normalized_email, new.id) then
      raise exception 'Admin account must be invited before promotion.' using errcode = '42501';
    end if;

    update public.admin_account_invites
    set used_by = coalesce(used_by, new.id),
        used_at = coalesce(used_at, now())
    where email = normalized_email
      and active = true;
  end if;

  return new;
end;
$$;

drop trigger if exists trg_teamvys_protect_app_profile_role on public.app_profiles;
create trigger trg_teamvys_protect_app_profile_role
before insert or update on public.app_profiles
for each row
execute function public.teamvys_protect_app_profile_role();

create or replace function public.teamvys_protect_coach_approval_fields()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.teamvys_app_role() = 'admin' then
    return new;
  end if;

  new.approval_status := old.approval_status;
  new.approval_requested_at := old.approval_requested_at;
  new.approved_at := old.approved_at;
  new.approved_by := old.approved_by;
  new.rejected_at := old.rejected_at;
  new.rejected_by := old.rejected_by;
  new.rejection_reason := old.rejection_reason;
  return new;
end;
$$;

drop trigger if exists trg_teamvys_protect_coach_approval_fields on public.coach_profiles;
create trigger trg_teamvys_protect_coach_approval_fields
before update on public.coach_profiles
for each row
execute function public.teamvys_protect_coach_approval_fields();

create or replace function public.teamvys_approve_coach(p_coach_id text)
returns table (coach_id text, status text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.teamvys_app_role() <> 'admin' then
    raise exception 'Only admin can approve coaches.' using errcode = '42501';
  end if;

  return query
  update public.coach_profiles coach
  set approval_status = 'approved',
      approved_at = now(),
      approved_by = auth.uid()::text,
      rejected_at = null,
      rejected_by = null,
      rejection_reason = null
  where coach.id = p_coach_id
  returning coach.id, coach.approval_status;
end;
$$;

create or replace function public.teamvys_reject_coach(p_coach_id text, p_reason text default null)
returns table (coach_id text, status text)
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.teamvys_app_role() <> 'admin' then
    raise exception 'Only admin can reject coaches.' using errcode = '42501';
  end if;

  return query
  update public.coach_profiles coach
  set approval_status = 'rejected',
      rejected_at = now(),
      rejected_by = auth.uid()::text,
      rejection_reason = nullif(trim(coalesce(p_reason, '')), ''),
      approved_at = null,
      approved_by = null
  where coach.id = p_coach_id
  returning coach.id, coach.approval_status;
end;
$$;

create or replace function public.teamvys_invite_admin(p_email text, p_note text default null)
returns table (email text, active boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  normalized_email text := lower(trim(coalesce(p_email, '')));
begin
  if public.teamvys_app_role() <> 'admin' then
    raise exception 'Only admin can invite another admin.' using errcode = '42501';
  end if;

  if normalized_email = '' or normalized_email not like '%@%' then
    raise exception 'Admin email is required.' using errcode = '22023';
  end if;

  insert into public.admin_account_invites (email, invited_by, note, active)
  values (normalized_email, auth.uid()::text, coalesce(p_note, ''), true)
  on conflict (email) do update set
    invited_by = excluded.invited_by,
    invited_at = now(),
    note = excluded.note,
    active = true;

  return query
  select invite.email, invite.active
  from public.admin_account_invites invite
  where invite.email = normalized_email;
end;
$$;

create or replace function public.teamvys_update_coach_payout_details(
  p_bank_account text default null,
  p_iban text default null,
  p_payout_account_holder text default null,
  p_payout_note text default null
)
returns table (
  bank_account text,
  iban text,
  payout_account_holder text,
  payout_note text,
  payout_details_updated_at timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null or public.teamvys_app_role() <> 'coach' then
    raise exception 'Only a coach can update payout details.' using errcode = '42501';
  end if;

  return query
  update public.coach_profiles coach
  set bank_account = nullif(trim(coalesce(p_bank_account, '')), ''),
      iban = nullif(upper(regexp_replace(coalesce(p_iban, ''), '\s+', '', 'g')), ''),
      payout_account_holder = nullif(trim(coalesce(p_payout_account_holder, '')), ''),
      payout_note = nullif(trim(coalesce(p_payout_note, '')), ''),
      payout_details_updated_at = now()
  where coach.id = auth.uid()::text
  returning coach.bank_account, coach.iban, coach.payout_account_holder, coach.payout_note, coach.payout_details_updated_at;
end;
$$;

alter table public.admin_account_invites enable row level security;

drop policy if exists "admin_account_invites admin access" on public.admin_account_invites;
create policy "admin_account_invites admin access" on public.admin_account_invites for all to authenticated
  using (public.teamvys_app_role() = 'admin')
  with check (public.teamvys_app_role() = 'admin');

drop policy if exists "participants scoped read" on public.participants;
create policy "participants scoped read" on public.participants for select
  using (id = auth.uid()::text or parent_profile_id = auth.uid()::text or public.teamvys_is_staff());

drop policy if exists "qr_events coach insert" on public.qr_events;
create policy "qr_events coach insert" on public.qr_events for insert to authenticated
  with check (coach_id = auth.uid()::text and public.teamvys_is_staff());

drop policy if exists "coach_wards coach read" on public.coach_wards;
create policy "coach_wards coach read" on public.coach_wards for select to authenticated
  using (public.teamvys_is_staff());

drop policy if exists "coach_manual_awards coach write" on public.coach_manual_trick_awards;
create policy "coach_manual_awards coach write" on public.coach_manual_trick_awards for insert to authenticated
  with check (coach_id = auth.uid()::text and public.teamvys_is_staff());

drop policy if exists "coach_profiles scoped read" on public.coach_profiles;
create policy "coach_profiles scoped read" on public.coach_profiles for select to authenticated
  using (id = auth.uid()::text or public.teamvys_is_staff());

drop policy if exists "coach_profiles own update" on public.coach_profiles;
create policy "coach_profiles own update" on public.coach_profiles for update to authenticated
  using (id = auth.uid()::text or public.teamvys_app_role() = 'admin')
  with check (id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "digital_passes scoped read" on public.digital_passes;
create policy "digital_passes scoped read" on public.digital_passes for select to authenticated
  using (
    participant_id = auth.uid()::text
    or exists (select 1 from public.participants where participants.id = digital_passes.participant_id and participants.parent_profile_id = auth.uid()::text)
    or public.teamvys_is_staff()
  );

drop policy if exists "digital_passes trusted insert" on public.digital_passes;
create policy "digital_passes trusted insert" on public.digital_passes for insert to authenticated
  with check (
    participant_id = auth.uid()::text
    or exists (select 1 from public.participants where participants.id = digital_passes.participant_id and participants.parent_profile_id = auth.uid()::text)
    or public.teamvys_is_staff()
  );

drop policy if exists "digital_passes trusted update" on public.digital_passes;
create policy "digital_passes trusted update" on public.digital_passes for update to authenticated
  using (
    participant_id = auth.uid()::text
    or exists (select 1 from public.participants where participants.id = digital_passes.participant_id and participants.parent_profile_id = auth.uid()::text)
    or public.teamvys_is_staff()
  )
  with check (
    participant_id = auth.uid()::text
    or exists (select 1 from public.participants where participants.id = digital_passes.participant_id and participants.parent_profile_id = auth.uid()::text)
    or public.teamvys_is_staff()
  );

drop policy if exists "course_documents scoped read" on public.course_documents;
create policy "course_documents scoped read" on public.course_documents for select to authenticated
  using (
    participant_id = auth.uid()::text
    or exists (select 1 from public.participants where participants.id = course_documents.participant_id and participants.parent_profile_id = auth.uid()::text)
    or public.teamvys_is_staff()
  );

drop policy if exists "parent_notifications scoped read" on public.parent_notifications;
create policy "parent_notifications scoped read" on public.parent_notifications for select to authenticated
  using (participant_id = auth.uid()::text or parent_profile_id = auth.uid()::text or public.teamvys_is_staff());

drop policy if exists "parent_notifications coach insert" on public.parent_notifications;
create policy "parent_notifications coach insert" on public.parent_notifications for insert to authenticated
  with check (public.teamvys_is_staff());

drop policy if exists "coach_sessions scoped access" on public.coach_sessions;
create policy "coach_sessions scoped access" on public.coach_sessions for all to authenticated
  using ((coach_id = auth.uid()::text and public.teamvys_is_approved_coach(auth.uid()::text)) or public.teamvys_app_role() = 'admin')
  with check ((coach_id = auth.uid()::text and public.teamvys_is_approved_coach(auth.uid()::text)) or public.teamvys_app_role() = 'admin');

drop policy if exists "coach_wards trusted write" on public.coach_wards;
create policy "coach_wards trusted write" on public.coach_wards for update to authenticated
  using (public.teamvys_is_staff())
  with check (public.teamvys_is_staff());

drop policy if exists "nfc_assignments coach access" on public.nfc_chip_assignments;
create policy "nfc_assignments coach access" on public.nfc_chip_assignments for all to authenticated
  using (public.teamvys_is_staff())
  with check (public.teamvys_is_staff());

drop policy if exists "bracelet_confirmations coach access" on public.bracelet_confirmations;
create policy "bracelet_confirmations coach access" on public.bracelet_confirmations for all to authenticated
  using (public.teamvys_is_staff())
  with check (public.teamvys_is_staff());

drop policy if exists "coach_attendance scoped access" on public.coach_attendance_records;
create policy "coach_attendance scoped access" on public.coach_attendance_records for all to authenticated
  using ((coach_id = auth.uid()::text and public.teamvys_is_approved_coach(auth.uid()::text)) or public.teamvys_app_role() = 'admin')
  with check ((coach_id = auth.uid()::text and public.teamvys_is_approved_coach(auth.uid()::text)) or public.teamvys_app_role() = 'admin');

drop policy if exists "child_attendance coach access" on public.child_attendance_records;
create policy "child_attendance coach access" on public.child_attendance_records for all to authenticated
  using (public.teamvys_is_staff())
  with check (public.teamvys_is_staff());

drop policy if exists "coach_leaderboard coach read" on public.coach_leaderboard;
create policy "coach_leaderboard coach read" on public.coach_leaderboard for select to authenticated
  using (public.teamvys_is_staff());

drop policy if exists "coach_reward_path coach read" on public.coach_reward_path;
create policy "coach_reward_path coach read" on public.coach_reward_path for select to authenticated
  using (public.teamvys_is_staff());

drop policy if exists "coach_payouts scoped read" on public.coach_payouts;
create policy "coach_payouts scoped read" on public.coach_payouts for select to authenticated
  using ((coach_id = auth.uid()::text and public.teamvys_is_approved_coach(auth.uid()::text)) or public.teamvys_app_role() = 'admin');

grant execute on function public.teamvys_approve_coach(text) to authenticated;
grant execute on function public.teamvys_reject_coach(text, text) to authenticated;
grant execute on function public.teamvys_invite_admin(text, text) to authenticated;
grant execute on function public.teamvys_update_coach_payout_details(text, text, text, text) to authenticated;