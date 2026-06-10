-- QR trick claims for ANY participant (not just a coach's wards) + arena gating.
--
-- Changes:
--   1. `coach_manual_trick_awards.ward_id` becomes nullable so a participant can
--      claim a trick even when they are not registered as a ward. XP is still
--      credited through the existing participant_id / participant_name trigger.
--   2. Per-participant de-dup index so the same participant can't claim a trick
--      twice when no ward is involved.
--   3. `teamvys_claim_qr_trick` no longer requires a ward and now blocks tricks
--      from skill-tree arenas (levels) the participant hasn't unlocked yet.

alter table public.coach_manual_trick_awards
  alter column ward_id drop not null;

create unique index if not exists coach_manual_trick_awards_participant_trick
  on public.coach_manual_trick_awards (participant_id, trick_id)
  where participant_id is not null;

drop function if exists public.teamvys_claim_qr_trick(text);

create function public.teamvys_claim_qr_trick(p_event_id text)
returns table (status text, trick_title text, xp integer, participant_name text, level integer)
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id text := auth.uid()::text;
  participant_record public.participants%rowtype;
  event_record public.qr_events%rowtype;
  trick_record public.coach_tricks%rowtype;
  ward_record public.coach_wards%rowtype;
  participant_full_name text;
  award_id text;
  required_xp integer;
begin
  if current_user_id is null then
    status := 'not-authenticated';
    return next;
    return;
  end if;

  select * into participant_record from public.participants where id = current_user_id;
  if not found then
    status := 'missing-participant';
    return next;
    return;
  end if;

  participant_full_name := trim(participant_record.first_name || ' ' || participant_record.last_name);

  select * into event_record from public.qr_events where id = trim(p_event_id);
  if not found then
    status := 'not-found';
    return next;
    return;
  end if;

  if event_record.created_at < now() - interval '60 seconds' then
    status := 'expired';
    return next;
    return;
  end if;

  select * into trick_record from public.coach_tricks where id = event_record.trick_id;
  if not found then
    status := 'not-found';
    return next;
    return;
  end if;

  -- Arena gating — block tricks from levels the participant hasn't unlocked.
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
    return next;
    return;
  end if;

  -- Ward is optional now — match one if it exists so completed_trick_ids stays in sync.
  select * into ward_record
  from public.coach_wards
  where participant_id = participant_record.id
     or name = participant_full_name
  order by case when participant_id = participant_record.id then 0 else 1 end
  limit 1;

  if exists (
    select 1 from public.coach_manual_trick_awards
    where trick_id = trick_record.id
      and (participant_id = participant_record.id
           or (ward_record.id is not null and ward_id = ward_record.id))
  ) then
    status := 'already-claimed';
    trick_title := trick_record.title;
    xp := trick_record.xp;
    participant_name := participant_full_name;
    level := trick_record.level;
    return next;
    return;
  end if;

  award_id := case
    when ward_record.id is not null then 'qr-award-' || ward_record.id || '-' || trick_record.id
    else 'qr-award-p-' || participant_record.id || '-' || trick_record.id
  end;

  begin
    insert into public.coach_manual_trick_awards (id, ward_id, participant_id, participant_name, trick_id, trick_title, coach_id, awarded_at_text)
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
    status := 'already-claimed';
    trick_title := trick_record.title;
    xp := trick_record.xp;
    participant_name := participant_full_name;
    level := trick_record.level;
    return next;
    return;
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
