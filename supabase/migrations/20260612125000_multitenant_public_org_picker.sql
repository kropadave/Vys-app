-- =============================================================================
-- Multi-tenant: public organization picker for registration forms
-- =============================================================================
-- Anonymous visitors registering on the web (parents) or in the Expo app
-- (participants / coaches) need to pick their organization BEFORE they have an
-- account. RLS on public.organizations only allows member reads, so we expose
-- a minimal, safe projection via a SECURITY DEFINER function:
--   • only id + name + org_type (no contact_email, Stripe ids, flags),
--   • only orgs that can accept new members (exempt / active / trialing),
--   • VYS first, then alphabetical.
-- Idempotent: create or replace.
-- =============================================================================

create or replace function public.teamvys_public_organizations()
returns table (id uuid, name text, org_type text)
language sql
stable
security definer
set search_path = public
as $$
  select o.id, o.name, o.org_type
  from public.organizations o
  where o.subscription_status in ('exempt', 'active', 'trialing')
  order by (o.org_type = 'vys') desc, o.name asc;
$$;

revoke all on function public.teamvys_public_organizations() from public;
grant execute on function public.teamvys_public_organizations() to anon, authenticated;
