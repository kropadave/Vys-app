-- Multi-tenant SaaS migration — read-only mode for lapsed subscriptions.
--
-- Blocks INSERT / UPDATE / DELETE on every org-scoped table when the owning
-- organization's subscription_status is 'past_due' or 'canceled'.
--
-- Implementation: a single BEFORE trigger on each table that has an org_id
-- column (instead of rewriting all 77 RLS policies again). Rationale:
--   • Many policies are FOR ALL — appending a write-lock conjunct there would
--     also block SELECT, which read-only mode must keep working.
--   • One trigger function is auditable and trivially reversible.
--
-- Exemptions:
--   • The VYS org has subscription_status = 'exempt' → never locked.
--   • service_role / postgres (the Express backend + Stripe webhooks) bypass
--     the trigger so billing can re-activate a locked org. App-level write
--     blocking for the backend is enforced by Express middleware.
--   • organizations / organization_members are excluded (billing must be able
--     to flip subscription_status; membership sync runs via triggers).
--
-- Idempotent: drop + recreate triggers, create or replace function.

begin;

create or replace function public.teamvys_block_locked_org_writes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_org_id uuid;
  v_status text;
  v_api_role text;
begin
  -- auth.role() is the PostgREST JWT role: 'authenticated' / 'anon' /
  -- 'service_role'. NULL for direct DB connections (migrations, backend
  -- maintenance). Only client roles are locked; the service role (Express
  -- backend + Stripe webhooks) bypasses so billing can re-activate an org.
  -- NOTE: current_user can't be used here — SECURITY DEFINER makes it the
  -- function owner for every caller.
  v_api_role := auth.role();
  if v_api_role is null or v_api_role = 'service_role' then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'DELETE' then
    v_org_id := old.org_id;
  else
    v_org_id := new.org_id;
  end if;

  if v_org_id is not null then
    select subscription_status into v_status
    from public.organizations
    where id = v_org_id;

    if v_status in ('past_due', 'canceled') then
      raise exception 'Předplatné organizace vypršelo — obnovte platbu pro plný přístup.'
        using errcode = 'P0001';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

-- Attach the trigger to every org-scoped table.
do $$
declare
  r record;
begin
  for r in
    select c.relname as table_name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    join pg_attribute a on a.attrelid = c.oid and a.attname = 'org_id' and not a.attisdropped
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname not in ('organizations', 'organization_members')
  loop
    execute format('drop trigger if exists trg_teamvys_org_write_lock on public.%I', r.table_name);
    execute format(
      'create trigger trg_teamvys_org_write_lock before insert or update or delete on public.%I for each row execute function public.teamvys_block_locked_org_writes()',
      r.table_name
    );
  end loop;
end;
$$;

commit;
