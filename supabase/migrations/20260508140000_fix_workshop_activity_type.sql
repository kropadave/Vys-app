-- Fix course_documents_activity_type_check to include 'Workshop'
-- The migration 20260506143000 was not applied to the live database.
do $$
begin
  alter table public.course_documents drop constraint if exists course_documents_activity_type_check;
  alter table public.course_documents add constraint course_documents_activity_type_check
    check (activity_type in ('Kroužek', 'Tábor', 'Workshop'));
end $$;
