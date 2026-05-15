-- Migration: create invoices table
-- Stores invoices parsed from emails sent to faktury@teamvys.cz
-- Flow: Gmail forward → Postmark inbound → Supabase Edge Function → Claude AI → this table

create table if not exists public.invoices (
  id               bigint generated always as identity primary key,
  dodavatel        text,
  castka           text,
  mena             text             default 'CZK',
  datum_vystaveni  text,
  datum_splatnosti text,
  cislo_faktury    text,
  popis            text,
  file_url         text,            -- Supabase Storage URL of the original PDF/attachment
  zaplaceno        boolean          not null default false,
  datum_zaplaceni  text,            -- set manually when invoice is paid
  odeslal          text,            -- original sender email address
  created_at       timestamptz      not null default now()
);

-- Storage bucket for invoice PDFs
insert into storage.buckets (id, name, public)
values ('invoices', 'invoices', false)
on conflict (id) do nothing;

-- Enable Row Level Security
alter table public.invoices enable row level security;

-- service_role has full access (used by Edge Function)
drop policy if exists "service_role full access" on public.invoices;
create policy "service_role full access"
  on public.invoices
  as permissive
  for all
  to service_role
  using (true)
  with check (true);

-- authenticated users (admin panel) can read invoices
drop policy if exists "authenticated read" on public.invoices;
create policy "authenticated read"
  on public.invoices
  as permissive
  for select
  to authenticated
  using (true);

-- authenticated users can update zaplaceno / datum_zaplaceni (mark as paid)
drop policy if exists "authenticated update" on public.invoices;
create policy "authenticated update"
  on public.invoices
  as permissive
  for update
  to authenticated
  using (true)
  with check (true);

-- service_role can access invoices storage bucket
drop policy if exists "service_role storage full access" on storage.objects;
create policy "service_role storage full access"
  on storage.objects
  as permissive
  for all
  to service_role
  using (bucket_id = 'invoices')
  with check (bucket_id = 'invoices');

-- authenticated users can download invoice files
drop policy if exists "authenticated storage read" on storage.objects;
create policy "authenticated storage read"
  on storage.objects
  as permissive
  for select
  to authenticated
  using (bucket_id = 'invoices');
