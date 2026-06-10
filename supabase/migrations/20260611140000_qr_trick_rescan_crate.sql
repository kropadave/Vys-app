-- QR trick second-scan: give a common crate (handled client-side) instead of half XP.
-- Also return trick_id so the app can optimistically mark the trick completed without a refresh.
--   • First scan  → status 'claimed'      (full XP via trigger)
--   • Second scan → status 'rescan-crate' (no XP; client awards a "Běžná bedna")
--   • Third+ scan → status 'already-claimed'

drop function if exists public.teamvys_claim_qr_trick(text);

create function public.teamvys_claim_qr_trick(p_event_id text)
returns table (status text, trick_title text, xp integer, participant_name text, level integer, trick_id text)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id   text := auth.uid()::text;
  participant_record public.participants%rowtype;
  event_record       public.qr_events%rowtype;
  trick_record       public.coach_tricks%rowtype;
  ward_record        public.coach_wards%rowtype;
  participant_full_name text;
  award_id           text;
  required_xp        integer;
begin
  if current_user_id is null then
    status := 'not-authenticated'; return next; return;
  end if;

  select * into participant_record from public.participants where id = current_user_id;
  if not found then
    status := 'missing-participant'; return next; return;
  end if;

  participant_full_name := trim(participant_record.first_name || ' ' || participant_record.last_name);

  select * into event_record from public.qr_events where id = trim(p_event_id);
  if not found then
    status := 'not-found'; return next; return;
  end if;

  if event_record.created_at < now() - interval '60 seconds' then
    status := 'expired'; return next; return;
  end if;

  select * into trick_record from public.coach_tricks where id = event_record.trick_id;
  if not found then
    status := 'not-found'; return next; return;
  end if;

  trick_id := trick_record.id;

  -- Arena gating
  required_xp := case coalesce(trick_record.level, 1)
    when 1 then 0
    when 2 then 1880
    when 3 then 7680
    when 4 then 20730
    when 5 then 45280
    else 0
  end;

  if coalesce(participant_record.xp, 0) < required_xp then
    status := 'arena-locked';
    trick_title := trick_record.title;
    xp := trick_record.xp;
    participant_name := participant_full_name;
    level := trick_record.level;
    return next; return;
  end if;

  -- Ward matching (optional)
  select * into ward_record
  from public.coach_wards
  where participant_id = participant_record.id
     or name = participant_full_name
  order by case when participant_id = participant_record.id then 0 else 1 end
  limit 1;

  -- Already claimed first time?
  if exists (
    select 1 from public.coach_manual_trick_awards
    where trick_id = trick_record.id
      and (participant_id = participant_record.id
           or (ward_record.id is not null and ward_id = ward_record.id))
  ) then
    -- Crate already granted on a previous rescan → fully blocked
    if exists (
      select 1 from public.qr_trick_rescan_claims
      where participant_id = participant_record.id
        and trick_id = trick_record.id
    ) then
      status := 'already-claimed';
      trick_title := trick_record.title;
      xp := trick_record.xp;
      participant_name := participant_full_name;
      level := trick_record.level;
      return next; return;
    end if;

    -- Second scan → grant a common crate (client rolls + awards it). No XP here.
    insert into public.qr_trick_rescan_claims (participant_id, trick_id, xp_awarded)
    values (participant_record.id, trick_record.id, 0)
    on conflict (participant_id, trick_id) do nothing;

    status := 'rescan-crate';
    trick_title := trick_record.title;
    xp := 0;
    participant_name := participant_full_name;
    level := trick_record.level;
    return next; return;
  end if;

  -- First claim — normal insert (trigger handles XP update)
  award_id := case
    when ward_record.id is not null then 'qr-award-' || ward_record.id || '-' || trick_record.id
    else 'qr-award-p-' || participant_record.id || '-' || trick_record.id
  end;

  begin
    insert into public.coach_manual_trick_awards
      (id, ward_id, participant_id, participant_name, trick_id, trick_title, coach_id, awarded_at_text)
    values (
      award_id,
      ward_record.id,
      participant_record.id,
      participant_full_name,
      trick_record.id,
      trick_record.title,
      coalesce(event_record.coach_id, 'coach-demo'),
      to_char(now() at time zone 'Europe/Prague', 'DD. MM. YYYY HH24:MI')
    );
  exception when unique_violation then
    -- Race condition: treat as second scan → crate, not XP
    if not exists (
      select 1 from public.qr_trick_rescan_claims
      where participant_id = participant_record.id
        and trick_id = trick_record.id
    ) then
      insert into public.qr_trick_rescan_claims (participant_id, trick_id, xp_awarded)
      values (participant_record.id, trick_record.id, 0)
      on conflict (participant_id, trick_id) do nothing;
      status := 'rescan-crate';
      xp := 0;
    else
      status := 'already-claimed';
      xp := trick_record.xp;
    end if;
    trick_title := trick_record.title;
    participant_name := participant_full_name;
    level := trick_record.level;
    return next; return;
  end;

  status := 'claimed';
  trick_title := trick_record.title;
  xp := trick_record.xp;
  participant_name := participant_full_name;
  level := trick_record.level;
  return next;
end;
$$;

grant execute on function public.teamvys_claim_qr_trick(text) to anon, authenticated, service_role;
