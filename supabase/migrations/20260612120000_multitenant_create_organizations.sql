-- ============================================================================
-- Multi-tenant Phase 1 / Migration 1: organizations + membership + VYS seed
-- ============================================================================
-- ADDITIVE ONLY. No existing table, column, policy or trigger is modified.
-- Safe to run repeatedly (idempotent).
--
-- What this does:
--   1. Creates public.organizations (tenant registry, Stripe-ready columns,
--      feature_flags JSONB, reserved branding columns).
--   2. Creates public.organization_members (junction table — parents and
--      coaches can belong to multiple organizations later).
--   3. Adds app_profiles.super_admin flag (needed by the future cross-org
--      Edge Function; defaults false, so no behavior change).
--   4. Seeds the Team VYS organization with a FIXED uuid
--      ('00000000-0000-4000-8000-000000000001') and subscription_status
--      'exempt' (VYS is the platform owner, never billed).
--   5. Seeds organization_members from every existing app_profiles row → VYS.
--   6. Enables RLS on the new tables with restrictive policies (no existing
--      client code touches these tables, so this cannot regress anything).
--   7. Adds helper function teamvys_user_org_ids() for use by Migration 3
--      (RLS org scoping) and the future org switcher.

begin;

-- ----------------------------------------------------------------------------
-- 1. organizations
-- ----------------------------------------------------------------------------
create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  org_type text not null default 'external'
    check (org_type in ('vys', 'external')),
  sport_type text,
  city text,
  contact_email text,
  stripe_customer_id text unique,                -- NULL for VYS (exempt)
  subscription_status text not null default 'trialing'
    check (subscription_status in ('trialing', 'active', 'past_due', 'canceled', 'exempt')),
  trial_ends_at timestamptz,
  subscription_ends_at timestamptz,
  feature_flags jsonb not null default '{}'::jsonb,
  -- Reserved for future per-org branding (MVP: everyone uses VYS theme)
  primary_color text,
  logo_url text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. organization_members (multi-org membership for parents / coaches)
--    profile_id is text to match the existing app_profiles text PK scheme
--    (auth.uid()::text or demo ids like 'parent-demo').
-- ----------------------------------------------------------------------------
create table if not exists public.organization_members (
  org_id uuid not null references public.organizations(id) on delete cascade,
  profile_id text not null references public.app_profiles(id) on delete cascade,
  role text not null check (role in ('participant', 'parent', 'coach', 'admin')),
  created_at timestamptz not null default now(),
  primary key (org_id, profile_id)
);

create index if not exists organization_members_profile_idx
  on public.organization_members (profile_id);

-- ----------------------------------------------------------------------------
-- 3. super_admin flag (VYS-internal role; default false = no behavior change)
-- ----------------------------------------------------------------------------
alter table public.app_profiles
  add column if not exists super_admin boolean not null default false;

-- ----------------------------------------------------------------------------
-- 4. Seed the Team VYS organization with a FIXED uuid.
--    This uuid is also used as the org_id column DEFAULT in Migration 2,
--    which is what keeps every existing (org-unaware) client working.
-- ----------------------------------------------------------------------------
insert into public.organizations
  (id, name, org_type, sport_type, city, contact_email, subscription_status, feature_flags)
values (
  '00000000-0000-4000-8000-000000000001',
  'Team VYS',
  'vys',
  'parkour',
  'Vyškov',
  'admin@teamvys.cz',
  'exempt',
  '{
    "org_type": "vys",
    "participant_wristbands": true,
    "participant_trick_xp": true,
    "participant_vys_leaderboard": true,
    "participant_spots_map": true,
    "participant_vys_quest_map": true,
    "participant_tutorials": true,
    "trainer_workshop_registration": true,
    "trainer_qr_codes": true,
    "trainer_spots": true,
    "trainer_leaderboard_qr_xp": true,
    "trainer_camps": true,
    "shared_arenas": true,
    "shared_mascots": true,
    "shared_attendance_quest_map": true,
    "shared_leaderboard": true
  }'::jsonb
)
on conflict (id) do update set
  org_type = excluded.org_type,
  subscription_status = excluded.subscription_status,
  feature_flags = excluded.feature_flags;

-- ----------------------------------------------------------------------------
-- 5. Seed membership: every existing profile belongs to VYS.
-- ----------------------------------------------------------------------------
insert into public.organization_members (org_id, profile_id, role)
select '00000000-0000-4000-8000-000000000001', p.id, p.role
from public.app_profiles p
on conflict (org_id, profile_id) do nothing;

-- ----------------------------------------------------------------------------
-- 6. Helper: org ids of the calling user (used by Migration 3 RLS and the
--    future org switcher). security definer so it can read membership rows
--    regardless of the caller's own RLS visibility.
-- ----------------------------------------------------------------------------
create or replace function public.teamvys_user_org_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select org_id
  from public.organization_members
  where profile_id = auth.uid()::text;
$$;

-- ----------------------------------------------------------------------------
-- 7. RLS for the NEW tables only. Existing tables and their policies are
--    untouched in this migration (policy updates come in Migration 3 with
--    an explicit old → new diff for review).
--    Writes to organizations / organization_members happen exclusively via
--    the server (service role bypasses RLS), so no write policies are added.
-- ----------------------------------------------------------------------------
alter table public.organizations enable row level security;
alter table public.organization_members enable row level security;

drop policy if exists "organizations member read" on public.organizations;
create policy "organizations member read" on public.organizations
  for select to authenticated
  using (
    id in (select public.teamvys_user_org_ids())
    or exists (
      select 1 from public.app_profiles ap
      where ap.id = auth.uid()::text and ap.super_admin
    )
  );

drop policy if exists "organization_members own read" on public.organization_members;
create policy "organization_members own read" on public.organization_members
  for select to authenticated
  using (
    profile_id = auth.uid()::text
    or exists (
      select 1 from public.app_profiles ap
      where ap.id = auth.uid()::text and ap.super_admin
    )
  );

commit;
