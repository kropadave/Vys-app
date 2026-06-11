-- Multi-tenant Phase 8: super admin approval gate for new organizations.
--
-- New orgs provisioned from Stripe checkout start as 'pending_approval' and
-- only go live ('trialing') once the super admin approves them in the
-- dashboard. This migration:
--   1. extends the subscription_status CHECK constraint with 'pending_approval'
--   2. extends the org write-lock trigger so pending orgs are read-only too
-- The VYS org ('exempt') is never affected.

begin;

alter table public.organizations
  drop constraint if exists organizations_subscription_status_check;

alter table public.organizations
  add constraint organizations_subscription_status_check
  check (subscription_status in ('pending_approval', 'trialing', 'active', 'past_due', 'canceled', 'exempt'));

-- Same body as 20260612124000_multitenant_org_write_lock.sql, with
-- 'pending_approval' added to the locked status list. Existing
-- trg_teamvys_org_write_lock triggers keep pointing at this function.
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

    if v_status = 'pending_approval' then
      raise exception 'Organizace čeká na schválení správcem platformy.'
        using errcode = 'P0001';
    end if;

    if v_status in ('past_due', 'canceled') then
      raise exception 'Předplatné organizace vypršelo — obnovte platbu pro plný přístup.'
        using errcode = 'P0001';
    end if;
  end if;

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

commit;
