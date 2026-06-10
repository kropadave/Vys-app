-- Add claim_code column to participants.
-- This is a unique, auto-generated code used by parents to link a participant
-- to their parent account. It cannot be changed after creation.

alter table public.participants
  add column if not exists claim_code text unique;

-- Generate a random 8-char claim code (XXXX-XXXX) for every existing participant
-- that doesn't have one yet. Uses the same character set as the app (no 0/O/1/I).
do $$
declare
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  participant_id text;
  code text;
  attempt int;
begin
  for participant_id in
    select id from public.participants where claim_code is null
  loop
    attempt := 0;
    loop
      -- Build an 8-character random code using random() (portable across Postgres versions)
      code := '';
      for i in 1..4 loop
        code := code || substr(chars, (floor(random() * length(chars))::int + 1), 1);
      end loop;
      code := code || '-';
      for i in 1..4 loop
        code := code || substr(chars, (floor(random() * length(chars))::int + 1), 1);
      end loop;

      -- Try to set it; retry on conflict
      begin
        update public.participants set claim_code = code where id = participant_id and claim_code is null;
        exit; -- success
      exception when unique_violation then
        attempt := attempt + 1;
        if attempt > 100 then
          raise exception 'Could not generate unique claim_code after 100 attempts';
        end if;
      end;
    end loop;
  end loop;
end $$;
