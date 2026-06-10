-- Migration: fix missing columns on invoices table + add kategorie
-- datum_splatnosti was in the original create migration but may not have been applied;
-- kategorie is new for category-based expense breakdown.

alter table public.invoices
  add column if not exists datum_splatnosti text,
  add column if not exists kategorie        text;

-- Allow authenticated (admin) users to insert invoice records directly
-- (needed for inserting via the backend server; service_role already has full access)
drop policy if exists "authenticated insert" on public.invoices;
create policy "authenticated insert"
  on public.invoices
  as permissive
  for insert
  to authenticated
  with check (true);

-- Allow authenticated users to delete their own rows (admin panel delete button)
drop policy if exists "authenticated delete" on public.invoices;
create policy "authenticated delete"
  on public.invoices
  as permissive
  for delete
  to authenticated
  using (true);

-- Allow authenticated users to upload PDFs to the invoices storage bucket
drop policy if exists "authenticated storage insert" on storage.objects;
create policy "authenticated storage insert"
  on storage.objects
  as permissive
  for insert
  to authenticated
  with check (bucket_id = 'invoices');
