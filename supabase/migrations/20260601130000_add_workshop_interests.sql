create table if not exists public.workshop_interests (
  id text primary key,
  parent_profile_id text references public.app_profiles(id) on delete cascade,
  product_id text not null references public.products(id) on delete cascade,
  participant_id text not null references public.participants(id) on delete cascade,
  participant_name text not null,
  created_at timestamptz not null default now()
);

create unique index if not exists workshop_interests_product_participant_key
  on public.workshop_interests (product_id, participant_id);

alter table public.workshop_interests enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'workshop_interests'
      and policyname = 'workshop_interests prototype all'
  ) then
    create policy "workshop_interests prototype all"
      on public.workshop_interests
      for all
      using (true)
      with check (true);
  end if;
end $$;
