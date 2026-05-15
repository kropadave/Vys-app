create or replace function public.teamvys_coach_session_is_workshop(p_session_id text, p_group_name text)
returns boolean
language sql
immutable
as $$
  select coalesce(p_session_id, '') like 'coach-workshop-%'
    or coalesce(p_group_name, '') like 'Workshop:%';
$$;

create or replace function public.teamvys_resolve_coach_attendance_rate(
  p_session_id text,
  p_coach_id text,
  p_default_rate integer default 500
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  target_session public.coach_sessions%rowtype;
  assigned_count integer := 0;
  is_assigned boolean := false;
  normal_rate integer := coalesce(p_default_rate, 500);
begin
  select *
  into target_session
  from public.coach_sessions
  where id = p_session_id;

  if not found then
    return normal_rate;
  end if;

  normal_rate := coalesce(target_session.hourly_rate, normal_rate, 500);

  if public.teamvys_coach_session_is_workshop(target_session.id, target_session.group_name) then
    return normal_rate;
  end if;

  select count(distinct coach_id), bool_or(coach_id = p_coach_id)
  into assigned_count, is_assigned
  from public.coach_sessions
  where city = target_session.city
    and venue = target_session.venue
    and day = target_session.day
    and time = target_session.time
    and coalesce(coach_id, '') <> ''
    and not public.teamvys_coach_session_is_workshop(id, group_name);

  if assigned_count = 1 and coalesce(is_assigned, false) then
    return 750;
  end if;

  return 500;
end;
$$;

create or replace function public.teamvys_apply_coach_attendance_rate()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  new.duration_hours := coalesce(nullif(new.duration_hours, 0), 1);
  new.hourly_rate := public.teamvys_resolve_coach_attendance_rate(new.session_id, new.coach_id, coalesce(new.hourly_rate, 500));
  new.amount := round(new.duration_hours * new.hourly_rate)::integer;
  return new;
end;
$$;

drop trigger if exists trg_teamvys_apply_coach_attendance_rate on public.coach_attendance_records;
create trigger trg_teamvys_apply_coach_attendance_rate
before insert or update of coach_id, session_id, duration_hours, hourly_rate on public.coach_attendance_records
for each row
execute function public.teamvys_apply_coach_attendance_rate();