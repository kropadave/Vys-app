-- ============================================================
-- OKAMŽITÝ CLEANUP DEMO DAT
-- Zkopíruj a spusť v Supabase dashboard → SQL Editor
-- Každý DELETE je samostatný — chyba na jednom neblokuje ostatní
-- ============================================================

-- 1. QR events (tabulka má jen: id, coach_id, trick_id, generated_at_text, valid_until_text, created_at)
delete from public.qr_events
where coach_id = 'coach-demo';

-- 2. NFC + bracelet (cascade children of coach_wards)
delete from public.nfc_chip_assignments
where ward_id in ('ward-eliska', 'ward-alex', 'ward-nela')
   or chip_id in ('NFC-VYS-0428', 'NFC-VYS-0612');

delete from public.bracelet_confirmations
where ward_id in ('ward-eliska', 'ward-alex', 'ward-nela');

-- 3. Manual trick awards
delete from public.coach_manual_trick_awards
where coach_id = 'coach-demo'
   or ward_id in ('ward-eliska', 'ward-alex', 'ward-nela');

-- 4. Coach wards
delete from public.coach_wards
where id in ('ward-eliska', 'ward-alex', 'ward-nela');

-- 5. Attendance records
delete from public.child_attendance_records
where session_id in ('session-vyskov-nadrazni', 'session-vyskov-purkynova', 'session-prostejov');

delete from public.coach_attendance_records
where coach_id = 'coach-demo'
   or session_id in ('session-vyskov-nadrazni', 'session-vyskov-purkynova', 'session-prostejov');

-- 6. Coach sessions
delete from public.coach_sessions
where coach_id = 'coach-demo'
   or id in ('session-vyskov-nadrazni', 'session-vyskov-purkynova', 'session-prostejov');

-- 7. Coach finance
delete from public.coach_payouts
where coach_id = 'coach-demo'
   or id = 'payout-coach-demo-current';

delete from public.coach_reviews
where coach_id = 'coach-demo'
   or parent_id = 'parent-demo';

delete from public.admin_coach_payout_transfers
where coach_id = 'coach-demo';

-- 8. Leaderboard — Filip Trenér
delete from public.coach_leaderboard
where id = 'leader-filip'
   or lower(name) in ('filip trenér', 'filip trener');

-- 9. Coach profile (cascade smaže zbytek sessions/attendance)
delete from public.coach_profiles
where id = 'coach-demo';

-- 10. Participant data
delete from public.course_documents
where participant_id in ('demo-child-1', 'demo-child-2')
   or lower(participant_name) in ('eliška nováková', 'eliska novakova', 'alex svoboda', 'nela horáková', 'nela horakova');

delete from public.digital_passes
where participant_id in ('demo-child-1', 'demo-child-2')
   or id = 'pass-demo-child-1';

delete from public.parent_purchases
where participant_id in ('demo-child-1', 'demo-child-2')
   or parent_profile_id = 'parent-demo';

delete from public.parent_payments
where participant_id in ('demo-child-1', 'demo-child-2')
   or id in ('pay-course-1', 'pay-camp-1');

delete from public.participants
where id in ('demo-child-1', 'demo-child-2');

-- 11. Demo faktury (pokud existují)
delete from public.invoices
where (lower(coalesce(dodavatel, '')) like '%nádražní vyškov%' or lower(coalesce(dodavatel, '')) like '%nadrazni vyskov%')
  and lower(coalesce(popis, '')) like '%tělocvičn%'
  and replace(coalesce(castka, ''), ' ', '') = '3200';

delete from public.invoices
where lower(coalesce(dodavatel, '')) like '%orel jednota%'
  and lower(coalesce(popis, '')) like '%hal%'
  and replace(coalesce(castka, ''), ' ', '') = '8500';

delete from public.invoices
where lower(coalesce(dodavatel, '')) like '%sportovní sklad%'
  and lower(coalesce(popis, '')) like '%matrací%'
  and replace(coalesce(castka, ''), ' ', '') = '14200';

delete from public.invoices
where lower(coalesce(dodavatel, '')) like '%prostějov%'
  and lower(coalesce(popis, '')) like '%tělocvičn%'
  and replace(coalesce(castka, ''), ' ', '') = '2800';

-- 12. Root demo profily (cascade → coach_profiles pokud zbylo)
delete from public.app_profiles
where id in ('parent-demo', 'participant-demo', 'coach-demo', 'admin-demo');

-- ============================================================
-- 13. Test Trenér + Test Účastník (testovací DB účty)
-- ============================================================

-- Nejdřív najdi jejich ID:
-- select id, role, name from public.app_profiles where lower(name) like '%test%';
-- select id, first_name, last_name from public.participants where lower(first_name) like '%test%' or lower(last_name) like '%test%';

-- Smaž výplaty Test Trenéra
delete from public.coach_payouts
where coach_id in (
  select id from public.coach_profiles
  where id in (select id from public.app_profiles where lower(name) like '%test trenér%' or lower(name) like '%test trener%')
);

delete from public.admin_coach_payout_transfers
where coach_id in (
  select id from public.app_profiles where lower(name) like '%test trenér%' or lower(name) like '%test trener%'
);

delete from public.coach_attendance_records
where coach_id in (
  select id from public.app_profiles where lower(name) like '%test trenér%' or lower(name) like '%test trener%'
);

delete from public.coach_sessions
where coach_id in (
  select id from public.app_profiles where lower(name) like '%test trenér%' or lower(name) like '%test trener%'
);

delete from public.coach_reviews
where coach_id in (
  select id from public.app_profiles where lower(name) like '%test trenér%' or lower(name) like '%test trener%'
);

delete from public.coach_profiles
where id in (
  select id from public.app_profiles where lower(name) like '%test trenér%' or lower(name) like '%test trener%'
);

-- Smaž Test Účastníka a jeho platby
delete from public.course_documents
where participant_id in (
  select id from public.participants where lower(first_name) like '%test%' or lower(last_name) like '%test%'
);

delete from public.digital_passes
where participant_id in (
  select id from public.participants where lower(first_name) like '%test%' or lower(last_name) like '%test%'
);

delete from public.parent_purchases
where participant_id in (
  select id from public.participants where lower(first_name) like '%test%' or lower(last_name) like '%test%'
)
or lower(participant_name) like '%test účastník%'
or lower(participant_name) like '%test ucastnik%';

delete from public.parent_payments
where participant_id in (
  select id from public.participants where lower(first_name) like '%test%' or lower(last_name) like '%test%'
)
or lower(participant_name) like '%test účastník%'
or lower(participant_name) like '%test ucastnik%';

delete from public.participants
where lower(first_name) like '%test%' or lower(last_name) like '%test%';

delete from public.app_profiles
where lower(name) like '%test trenér%'
   or lower(name) like '%test trener%'
   or lower(name) like '%test účastník%'
   or lower(name) like '%test ucastnik%';

-- ============================================================
-- Hotovo. Zkontroluj:
-- select id, role, name from public.app_profiles;
-- select id from public.coach_profiles;
-- select id, first_name, last_name from public.participants;
-- select participant_name, amount from public.parent_payments order by created_at desc limit 20;
-- ============================================================
