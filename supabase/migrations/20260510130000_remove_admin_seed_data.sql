-- Remove prototype/seed rows from production.
-- Each statement runs independently so one failure does NOT roll back the rest.

-- ── 1. QR events (cascade child of coach_wards) ────────────────────────────
delete from public.qr_events
where ward_id in ('ward-eliska', 'ward-alex', 'ward-nela')
   or coach_id = 'coach-demo'
   or session_id in ('session-vyskov-nadrazni', 'session-vyskov-purkynova', 'session-prostejov');

-- ── 2. NFC / bracelet (cascade children of coach_wards) ─────────────────────
delete from public.nfc_chip_assignments
where ward_id in ('ward-eliska', 'ward-alex', 'ward-nela')
   or chip_id in ('NFC-VYS-0428', 'NFC-VYS-0612');

delete from public.bracelet_confirmations
where ward_id in ('ward-eliska', 'ward-alex', 'ward-nela');

-- ── 3. Manual trick awards (FK to both coach_wards AND coach_profiles) ───────
delete from public.coach_manual_trick_awards
where coach_id = 'coach-demo'
   or ward_id in ('ward-eliska', 'ward-alex', 'ward-nela')
   or id = 'manual-ward-eliska-wall-spin';

-- ── 4. Coach wards (now safe — children already removed) ─────────────────────
delete from public.coach_wards
where id in ('ward-eliska', 'ward-alex', 'ward-nela');

-- ── 5. Attendance records ────────────────────────────────────────────────────
delete from public.child_attendance_records
where session_id in ('session-vyskov-nadrazni', 'session-vyskov-purkynova', 'session-prostejov')
   or id in ('children-2026-04-24-nadrazni', 'children-2026-04-17-nadrazni', 'children-2026-04-22-purkynova', 'children-2026-04-18-prostejov');

delete from public.coach_attendance_records
where coach_id = 'coach-demo'
   or session_id in ('session-vyskov-nadrazni', 'session-vyskov-purkynova', 'session-prostejov')
   or id in ('coach-att-2026-04-24-nadrazni', 'coach-att-2026-04-22-purkynova', 'coach-att-2026-04-18-prostejov');

-- ── 6. Coach sessions (FK to coach_profiles — remove before profiles) ────────
delete from public.coach_sessions
where coach_id = 'coach-demo'
   or id in ('session-vyskov-nadrazni', 'session-vyskov-purkynova', 'session-prostejov');

-- ── 7. Coach finance rows ─────────────────────────────────────────────────────
delete from public.coach_payouts
where coach_id = 'coach-demo'
   or id = 'payout-coach-demo-current';

delete from public.coach_reviews
where coach_id = 'coach-demo'
   or parent_id = 'parent-demo'
   or id in ('review-parent-demo-coach-demo', 'review-parent-demo-coach-marek');

delete from public.admin_coach_payout_transfers
where coach_id = 'coach-demo'
   or lower(coach_name) in ('filip trenér', 'filip trener');

-- ── 8. Coach leaderboard (no FK — standalone row) ────────────────────────────
delete from public.coach_leaderboard
where id = 'leader-filip'
   or lower(name) in ('filip trenér', 'filip trener');

-- ── 9. Coach profile (cascade deletes any remaining sessions / attendance) ───
delete from public.coach_profiles
where id = 'coach-demo';

-- ── 10. Participant-related rows ─────────────────────────────────────────────
delete from public.course_documents
where participant_id in ('demo-child-1', 'demo-child-2')
   or purchase_id in ('pay-course-1', 'pay-camp-1')
   or lower(participant_name) in ('eliška nováková', 'eliska novakova', 'alex svoboda', 'nela horáková', 'nela horakova');

delete from public.digital_passes
where participant_id in ('demo-child-1', 'demo-child-2')
   or id = 'pass-demo-child-1';

delete from public.parent_purchases
where participant_id in ('demo-child-1', 'demo-child-2')
   or parent_profile_id = 'parent-demo'
   or id in ('pay-course-1', 'pay-camp-1');

delete from public.parent_payments
where participant_id in ('demo-child-1', 'demo-child-2')
   or id in ('pay-course-1', 'pay-camp-1');

delete from public.parent_notifications
where id like 'note-%'
   and (text like '%Eliška%' or text like '%Alex%' or text like '%Nela%');

delete from public.participants
where id in ('demo-child-1', 'demo-child-2')
   or parent_profile_id = 'parent-demo';

-- ── 11. Demo invoices ─────────────────────────────────────────────────────────
delete from public.invoices
where (
      lower(coalesce(dodavatel, '')) in ('zš nádražní vyškov', 'zs nadrazni vyskov')
      and lower(coalesce(popis, '')) like any (array['%pronájem tělocvičny%', '%pronajem telocvicny%'])
      and replace(coalesce(castka, ''), ' ', '') = '3200'
  ) or (
      lower(coalesce(dodavatel, '')) in ('orel jednota vyškov', 'orel jednota vyskov')
      and lower(coalesce(popis, '')) like any (array['%pronájem haly%', '%pronajem haly%'])
      and replace(coalesce(castka, ''), ' ', '') = '8500'
  ) or (
      lower(coalesce(dodavatel, '')) in ('sportovní sklad praha', 'sportovni sklad praha')
      and lower(coalesce(popis, '')) like any (array['%nákup matrací%', '%nakup matraci%'])
      and replace(coalesce(castka, ''), ' ', '') = '14200'
  ) or (
      lower(coalesce(dodavatel, '')) in ('zš prostějov', 'zs prostejov')
      and lower(coalesce(popis, '')) like any (array['%pronájem tělocvičny%', '%pronajem telocvicny%'])
      and replace(coalesce(castka, ''), ' ', '') = '2800'
  ) or lower(coalesce(dodavatel, '') || ' ' || coalesce(popis, '')) like '%teamvys%test%';

-- ── 12. Root demo profiles (cascade removes coach_profiles if still present) ─
delete from public.app_profiles
where id in ('parent-demo', 'participant-demo', 'coach-demo', 'admin-demo');

commit;
