-- ============================================================================
-- Multi-tenant Phase 1 / Migration 2: backfill org_id on all existing tables
-- ============================================================================
-- ADDITIVE ONLY. Run after 20260612120000_multitenant_create_organizations.sql.
-- Safe to run repeatedly (idempotent).
--
-- For each of the 38 existing public tables (verified against the live DB on
-- 2026-06-10; none had org_id):
--   1. ADD COLUMN org_id uuid                       (no-op if already present)
--   2. UPDATE ... SET org_id = <VYS>                (backfill existing rows)
--   3. SET DEFAULT <VYS org uuid>                   ← CRITICAL: existing
--      org-unaware clients (Expo app, web, Express server) never send
--      org_id; the default makes their INSERTs keep working unchanged.
--      Defaults will be dropped in a later phase once all write paths are
--      org-aware.
--   4. ADD FK → organizations(id)                   (NOT VALID + VALIDATE to
--      avoid long locks; backfill guarantees validity)
--   5. SET NOT NULL
--   6. CREATE INDEX on org_id                       (RLS scoping performance)
--
-- Notes on specific tables:
--   • coach_tricks, coach_reward_path, product_faqs: VYS-fixed content
--     catalogs. They get org_id = VYS like everything else; external orgs
--     simply never have rows here (tutorials/tricks are VYS-only features).
--   • nfc_chip_assignments: PK stays chip_id (changing a PK would be
--     breaking). Existing VYS UIDs remain valid. Per-org UID namespacing
--     (composite uniqueness + org-filtered lookup) is handled in Phase 3
--     together with the RLS/RPC updates — flagged as known risk #2.
--   • Shared/global gamification catalogs (mascot & arena definitions) do
--     not exist as tables yet (mascots live in participants.owned_mascots
--     jsonb), so there is nothing to exclude from org scoping today.

begin;

do $$
declare
  t text;
  vys_org constant uuid := '00000000-0000-4000-8000-000000000001';
  fk_name text;
  idx_name text;
begin
  -- Guard: the VYS organization row must exist (Migration 1).
  if not exists (select 1 from public.organizations where id = vys_org) then
    raise exception 'VYS organization % not found — run 20260612120000_multitenant_create_organizations.sql first', vys_org;
  end if;

  foreach t in array array[
    -- profiles & participants
    'app_profiles', 'participants',
    -- catalog / shop
    'products', 'product_faqs', 'admin_product_drafts',
    -- parent domain
    'parent_payments', 'parent_purchases', 'parent_notifications',
    'workshop_interests', 'course_documents', 'digital_passes',
    -- coach domain
    'coach_profiles', 'coach_sessions', 'coach_wards',
    'coach_attendance_records', 'child_attendance_records',
    'coach_tricks', 'qr_events', 'coach_manual_trick_awards',
    'coach_leaderboard', 'coach_reward_path', 'coach_payouts',
    'coach_reviews', 'coach_live_locations',
    'coach_training_games', 'coach_training_game_ratings', 'coach_training_game_favorites',
    -- attendance / NFC / gamification
    'nfc_chip_assignments', 'bracelet_confirmations',
    'workshop_xp_awards', 'qr_trick_rescan_claims',
    -- spots
    'training_spots', 'spot_reviews',
    -- admin / finance
    'admin_coach_access_keys', 'admin_attendance_adjustments',
    'admin_coach_payout_transfers', 'admin_account_invites',
    'invoices'
  ] loop
    -- 1. add column (nullable first, so existing rows are untouched)
    execute format('alter table public.%I add column if not exists org_id uuid', t);

    -- 2. backfill every existing row to VYS
    execute format('update public.%I set org_id = %L where org_id is null', t, vys_org);

    -- 3. default to VYS so existing org-unaware INSERT paths keep working
    execute format('alter table public.%I alter column org_id set default %L', t, vys_org);

    -- 4. FK to organizations (NOT VALID first to minimize lock time)
    fk_name := t || '_org_id_fkey';
    if not exists (
      select 1 from pg_constraint c
      join pg_class r on r.oid = c.conrelid
      join pg_namespace n on n.oid = r.relnamespace
      where n.nspname = 'public' and r.relname = t and c.conname = fk_name
    ) then
      execute format(
        'alter table public.%I add constraint %I foreign key (org_id) references public.organizations(id) not valid',
        t, fk_name
      );
      execute format('alter table public.%I validate constraint %I', t, fk_name);
    end if;

    -- 5. enforce NOT NULL (safe: every row was just backfilled)
    execute format('alter table public.%I alter column org_id set not null', t);

    -- 6. index for org-scoped queries / future RLS policies
    idx_name := t || '_org_id_idx';
    execute format('create index if not exists %I on public.%I (org_id)', idx_name, t);
  end loop;
end $$;

-- ----------------------------------------------------------------------------
-- Keep organization_members consistent with app_profiles.org_id.
-- The existing auth signup trigger (teamvys_sync_auth_user_profile) inserts
-- into app_profiles without org_id → the VYS default applies → this trigger
-- mirrors the membership row. Org-aware signup flows (Phase 2+) that set an
-- explicit org_id are handled identically. Additive; existing flows unchanged.
-- ----------------------------------------------------------------------------
create or replace function public.teamvys_sync_org_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.org_id is not null then
    insert into public.organization_members (org_id, profile_id, role)
    values (new.org_id, new.id, new.role)
    on conflict (org_id, profile_id) do update set role = excluded.role;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_teamvys_sync_org_membership on public.app_profiles;
create trigger trg_teamvys_sync_org_membership
after insert or update of org_id, role on public.app_profiles
for each row
execute function public.teamvys_sync_org_membership();

commit;
