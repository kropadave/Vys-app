-- Participant rewards: klubíčka (coins), converted attendance counter and owned mascots.
-- This connects the coach-recorded NFC attendance (participants.attendance_done, incremented
-- by teamvys_scan_digital_pass) to the kid-facing "klubíčka" economy in the mobile app.
--
-- Flow:
--   • Coach scans NFC chip -> attendance_done++ (already handled by RPC).
--   • Kid opens Docházka screen -> pending = attendance_done - converted_attendance.
--   • Kid converts an attendance entry -> converted_attendance++ and coins += COINS_PER_SESSION.
--   • Kid buys a crate -> coins -= price, owned mascot persisted in owned_mascots.

alter table public.participants
  add column if not exists coins integer not null default 0;

alter table public.participants
  add column if not exists converted_attendance integer not null default 0;

alter table public.participants
  add column if not exists owned_mascots jsonb not null default '[]'::jsonb;
