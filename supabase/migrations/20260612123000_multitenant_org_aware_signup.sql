-- ============================================================================
-- Multi-tenant Phase 5 / Migration 4: org-aware auth signup trigger
-- ============================================================================
-- Run after 20260612122000_multitenant_rls_org_scope.sql. Idempotent.
--
-- Recreates teamvys_sync_auth_user_profile from its LIVE definition (dumped
-- 2026-06-10, includes admin-invite gating and coach approval logic) with one
-- additive change: it reads `org_id` from auth.users.raw_user_meta_data and
-- stamps it onto app_profiles / coach_profiles / participants.
--
-- Backwards compatible:
--   • Existing VYS signups send NO org_id in metadata → resolved_org falls
--     back to the VYS org uuid → identical behavior to the column default.
--   • An invalid / unknown org_id in metadata also falls back to VYS rather
--     than failing signup.
--   • External-org signups (created by the new /api/orgs/register webhook
--     provisioning with explicit org_id metadata) land in their own org;
--     trg_teamvys_sync_org_membership then mirrors the membership row.

begin;

create or replace function public.teamvys_sync_auth_user_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  requested_role text := coalesce(new.raw_user_meta_data ->> 'role', 'participant');
  profile_role text := requested_role;
  profile_name text := coalesce(nullif(trim(new.raw_user_meta_data ->> 'name'), ''), new.email, 'TeamVYS');
  profile_phone text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'phone', '')), '');
  birth_date text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'birthDate', '')), '');
  coach_message text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'coachMessage', '')), '');
  resolved_org uuid := '00000000-0000-4000-8000-000000000001';
  meta_org uuid;
  first_name text;
  last_name text;
begin
  -- Multi-tenant: explicit org from signup metadata (fallback: VYS)
  begin
    meta_org := nullif(trim(coalesce(new.raw_user_meta_data ->> 'org_id', '')), '')::uuid;
  exception when others then
    meta_org := null;
  end;
  if meta_org is not null and exists (select 1 from public.organizations o where o.id = meta_org) then
    resolved_org := meta_org;
  end if;

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

  insert into public.app_profiles (id, role, name, email, phone, bio, org_id)
  values (new.id::text, profile_role, profile_name, new.email, profile_phone, case when profile_role = 'coach' then coach_message else null end, resolved_org)
  on conflict (id) do update set
    role = excluded.role,
    name = excluded.name,
    email = excluded.email,
    phone = excluded.phone,
    bio = coalesce(excluded.bio, public.app_profiles.bio),
    org_id = excluded.org_id;

  if profile_role = 'coach' then
    insert into public.coach_profiles (id, level, xp, next_level_xp, qr_tricks_approved, attendance_logged, bonus_total, assigned_courses, approval_status, approval_requested_at, org_id)
    values (new.id::text, 1, 0, 500, 0, 0, 0, '{}', 'pending', now(), resolved_org)
    on conflict (id) do update set
      approval_status = case when public.coach_profiles.approval_status = 'approved' then public.coach_profiles.approval_status else 'pending' end,
      approval_requested_at = coalesce(public.coach_profiles.approval_requested_at, now());
  elsif profile_role = 'participant' then
    first_name := split_part(profile_name, ' ', 1);
    last_name := nullif(trim(substr(profile_name, length(first_name) + 1)), '');

    insert into public.participants (id, first_name, last_name, date_of_birth, parent_phone, without_phone, paid_status, active_purchases, level, xp, next_bracelet_xp, bracelet, bracelet_color, org_id)
    values (new.id::text, coalesce(nullif(first_name, ''), 'Účastník'), coalesce(last_name, 'TeamVYS'), birth_date, profile_phone, profile_phone is null, 'due', '[]'::jsonb, 1, 0, 600, 'Béžová', '#D8C2A3', resolved_org)
    on conflict (id) do nothing;
  end if;

  return new;
end;
$function$;

commit;
