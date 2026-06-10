-- Workshop XP awards: tracks per-participant XP earned from workshop QR scans.
-- Uses participant_id (not ward_id) so it works for any participant,
-- not just those registered as wards of a specific coach.

create table if not exists public.workshop_xp_awards (
  id text primary key,
  participant_id text not null,
  participant_name text not null,
  product_id text not null,
  product_title text not null,
  tricks_completed integer not null,
  xp_awarded integer not null,
  coach_id text,
  awarded_at_text text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists workshop_xp_awards_participant_product
  on public.workshop_xp_awards (participant_id, product_id);

alter table public.workshop_xp_awards enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workshop_xp_awards'
      and policyname = 'workshop_xp_awards prototype all'
  ) then
    create policy "workshop_xp_awards prototype all"
      on public.workshop_xp_awards for all using (true) with check (true);
  end if;
end $$;
