-- Live coach location sharing for the training-spots map.
--
-- A coach can opt in to share their current GPS position. Every coach/admin can
-- then see other coaches' live positions on the map and, when viewing a spot,
-- which coaches are currently there. Only the coach name and XP are exposed —
-- no contact details. Rows are denormalized (coach_name, xp copied in) so the
-- map needs no joins and the read policy stays trivial.
--
-- Stale rows (older than 15 minutes) are treated as "offline" on the client and
-- can be cleaned up opportunistically.

create table if not exists public.coach_live_locations (
  coach_id text primary key references public.app_profiles(id) on delete cascade,
  coach_name text not null,
  xp integer not null default 0,
  lat double precision not null,
  lng double precision not null,
  updated_at timestamptz not null default now()
);

alter table public.coach_live_locations enable row level security;

-- Any authenticated coach/admin can read all live locations.
drop policy if exists "coach_live_locations_select" on public.coach_live_locations;
create policy "coach_live_locations_select" on public.coach_live_locations
  for select to authenticated
  using (
    exists (
      select 1 from public.app_profiles p
      where p.id::uuid = auth.uid() and p.role in ('coach', 'admin')
    )
  );

-- A coach may only insert/update/delete their own row.
drop policy if exists "coach_live_locations_insert" on public.coach_live_locations;
create policy "coach_live_locations_insert" on public.coach_live_locations
  for insert to authenticated
  with check (auth.uid() = coach_id::uuid);

drop policy if exists "coach_live_locations_update" on public.coach_live_locations;
create policy "coach_live_locations_update" on public.coach_live_locations
  for update to authenticated
  using (auth.uid() = coach_id::uuid)
  with check (auth.uid() = coach_id::uuid);

drop policy if exists "coach_live_locations_delete" on public.coach_live_locations;
create policy "coach_live_locations_delete" on public.coach_live_locations
  for delete to authenticated
  using (auth.uid() = coach_id::uuid);
