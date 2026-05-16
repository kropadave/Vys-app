-- Community training games created and shared by coaches.

create table if not exists public.coach_training_games (
  id text primary key,
  title text not null,
  description text not null,
  rules text not null,
  age_group text not null,
  player_count text not null,
  space_needed text not null,
  skill_goal text not null,
  type text not null check (type in ('warmup', 'skill-building', 'cooldown', 'competition')),
  created_by text not null references public.app_profiles(id) on delete cascade,
  created_by_name text not null,
  created_at_text text not null,
  updated_at_text text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists coach_training_games_type_idx on public.coach_training_games (type);
create index if not exists coach_training_games_created_by_idx on public.coach_training_games (created_by);
create index if not exists coach_training_games_created_at_idx on public.coach_training_games (created_at desc);

create table if not exists public.coach_training_game_ratings (
  id text primary key,
  game_id text not null references public.coach_training_games(id) on delete cascade,
  coach_id text not null references public.app_profiles(id) on delete cascade,
  coach_name text not null,
  rating integer not null check (rating between 1 and 5),
  created_at_text text not null,
  created_at timestamptz not null default now(),
  unique (game_id, coach_id)
);

create index if not exists coach_training_game_ratings_game_idx on public.coach_training_game_ratings (game_id);

create table if not exists public.coach_training_game_favorites (
  id text primary key,
  game_id text not null references public.coach_training_games(id) on delete cascade,
  coach_id text not null references public.app_profiles(id) on delete cascade,
  created_at_text text not null,
  created_at timestamptz not null default now(),
  unique (game_id, coach_id)
);

create index if not exists coach_training_game_favorites_coach_idx on public.coach_training_game_favorites (coach_id);

alter table public.coach_training_games enable row level security;
alter table public.coach_training_game_ratings enable row level security;
alter table public.coach_training_game_favorites enable row level security;

drop policy if exists "coach_training_games coach read" on public.coach_training_games;
create policy "coach_training_games coach read" on public.coach_training_games for select to authenticated
  using (public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "coach_training_games coach insert" on public.coach_training_games;
create policy "coach_training_games coach insert" on public.coach_training_games for insert to authenticated
  with check (created_by = auth.uid()::text and public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "coach_training_games owner update" on public.coach_training_games;
create policy "coach_training_games owner update" on public.coach_training_games for update to authenticated
  using (created_by = auth.uid()::text or public.teamvys_app_role() = 'admin')
  with check (created_by = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "coach_training_games owner delete" on public.coach_training_games;
create policy "coach_training_games owner delete" on public.coach_training_games for delete to authenticated
  using (created_by = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "coach_training_game_ratings coach read" on public.coach_training_game_ratings;
create policy "coach_training_game_ratings coach read" on public.coach_training_game_ratings for select to authenticated
  using (public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "coach_training_game_ratings own insert" on public.coach_training_game_ratings;
create policy "coach_training_game_ratings own insert" on public.coach_training_game_ratings for insert to authenticated
  with check (coach_id = auth.uid()::text and public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "coach_training_game_ratings own update" on public.coach_training_game_ratings;
create policy "coach_training_game_ratings own update" on public.coach_training_game_ratings for update to authenticated
  using (coach_id = auth.uid()::text or public.teamvys_app_role() = 'admin')
  with check (coach_id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "coach_training_game_ratings own delete" on public.coach_training_game_ratings;
create policy "coach_training_game_ratings own delete" on public.coach_training_game_ratings for delete to authenticated
  using (coach_id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "coach_training_game_favorites own read" on public.coach_training_game_favorites;
create policy "coach_training_game_favorites own read" on public.coach_training_game_favorites for select to authenticated
  using (coach_id = auth.uid()::text or public.teamvys_app_role() = 'admin');

drop policy if exists "coach_training_game_favorites own insert" on public.coach_training_game_favorites;
create policy "coach_training_game_favorites own insert" on public.coach_training_game_favorites for insert to authenticated
  with check (coach_id = auth.uid()::text and public.teamvys_app_role() in ('coach', 'admin'));

drop policy if exists "coach_training_game_favorites own delete" on public.coach_training_game_favorites;
create policy "coach_training_game_favorites own delete" on public.coach_training_game_favorites for delete to authenticated
  using (coach_id = auth.uid()::text or public.teamvys_app_role() = 'admin');