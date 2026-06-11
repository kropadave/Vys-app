-- ============================================================================
-- Multi-tenant Phase 3 / Migration 3: org-scope all existing RLS policies
-- ============================================================================
-- Run after 20260612121000_multitenant_backfill_org_id.sql. Idempotent.
--
-- Uniform transformation applied to every PERMISSIVE policy on every public
-- table that has org_id (verified live dump of 80 policies, 2026-06-10):
--
--   OLD:  USING (<expr>)              [/ WITH CHECK (<expr>)]
--   NEW:  USING ((<expr>) AND public.teamvys_org_match(org_id))
--
-- The original expression is preserved VERBATIM (taken from pg_policies at
-- execution time), so this is drift-proof: whatever is live gets the org
-- conjunct appended — nothing else about the policy changes (name, command,
-- roles, permissive-ness all preserved).
--
-- Why this is non-breaking for VYS:
--   • Every VYS user is a member of the VYS org (seeded in Migration 1,
--     maintained by trg_teamvys_sync_org_membership) and every existing row
--     has org_id = VYS → the new conjunct is always TRUE for current users.
--   • Anonymous flows (guest QR claim, demo web, public shop) hit the
--     `auth.uid() IS NULL` escape → behavior byte-for-byte unchanged.
--     (Tightening anon access is a later phase: move guest flows to
--     security-definer RPCs, then drop the anon escape.)
--   • Service-role policies are skipped (service role bypasses RLS anyway).
--   • organizations / organization_members are skipped (already org-scoped
--     by Migration 1 policies).
--
-- Deliberate decisions:
--   • NO super_admin escape here — per spec, super admin reads other orgs
--     only via the Phase 4 Edge Function (aggregates, service role).
--   • "Bootstrap" escape (user has zero membership rows) keeps client-side
--     self-insert of app_profiles/participants working during signup, before
--     the membership trigger has fired. It grants nothing beyond what the
--     original policy expression already allows.

begin;

-- ----------------------------------------------------------------------------
-- 1. Helper: does the calling user's org context match this row's org?
-- ----------------------------------------------------------------------------
create or replace function public.teamvys_org_match(p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    -- anon / demo / guest flows: keep legacy behavior unchanged
    auth.uid() is null
    -- normal case: user is a member of the row's organization
    or exists (
      select 1 from public.organization_members m
      where m.profile_id = auth.uid()::text
        and m.org_id = p_org_id
    )
    -- signup bootstrap: user has no membership rows yet (pre-trigger)
    or not exists (
      select 1 from public.organization_members m
      where m.profile_id = auth.uid()::text
    );
$$;

grant execute on function public.teamvys_org_match(uuid) to public;

-- ----------------------------------------------------------------------------
-- 2. Defensive re-seed: any profile missing a membership row gets VYS.
--    (Covers profiles created in any gap between Migration 1 and the trigger.)
-- ----------------------------------------------------------------------------
insert into public.organization_members (org_id, profile_id, role)
select coalesce(p.org_id, '00000000-0000-4000-8000-000000000001'), p.id, p.role
from public.app_profiles p
where not exists (
  select 1 from public.organization_members m where m.profile_id = p.id
)
on conflict (org_id, profile_id) do nothing;

-- ----------------------------------------------------------------------------
-- 3. Rewrite every existing policy: append AND teamvys_org_match(org_id).
-- ----------------------------------------------------------------------------
do $do$
declare
  pol record;
  new_qual text;
  new_check text;
  stmt text;
  rewritten integer := 0;
begin
  for pol in
    select p.tablename, p.policyname, p.cmd, p.roles, p.qual, p.with_check
    from pg_policies p
    where p.schemaname = 'public'
      -- only tables that actually have org_id
      and exists (
        select 1 from information_schema.columns c
        where c.table_schema = 'public'
          and c.table_name = p.tablename
          and c.column_name = 'org_id'
      )
      -- new-tenancy tables already org-scoped by Migration 1
      and p.tablename not in ('organizations', 'organization_members')
      -- service role bypasses RLS; leave its policies untouched
      and not ('service_role' = any (p.roles))
      -- idempotency: skip policies already org-scoped
      and coalesce(p.qual, '') not like '%teamvys_org_match%'
      and coalesce(p.with_check, '') not like '%teamvys_org_match%'
  loop
    -- OLD → NEW: original expression preserved verbatim inside the conjunct
    new_qual := case
      when pol.qual is not null
        then '(' || pol.qual || ') AND public.teamvys_org_match(org_id)'
    end;
    new_check := case
      when pol.with_check is not null
        then '(' || pol.with_check || ') AND public.teamvys_org_match(org_id)'
    end;

    execute format('drop policy %I on public.%I', pol.policyname, pol.tablename);

    stmt := format(
      'create policy %I on public.%I for %s to %s',
      pol.policyname, pol.tablename, pol.cmd, array_to_string(pol.roles, ', ')
    );
    if new_qual is not null then
      stmt := stmt || ' using (' || new_qual || ')';
    end if;
    if new_check is not null then
      stmt := stmt || ' with check (' || new_check || ')';
    end if;

    execute stmt;
    rewritten := rewritten + 1;
    raise notice 'org-scoped: %.% [%]', pol.tablename, pol.policyname, pol.cmd;
  end loop;

  raise notice 'total policies rewritten: %', rewritten;
end $do$;

commit;
