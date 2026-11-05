-- Optional: send "due back tomorrow" reminders automatically every day.
-- Needs the pg_cron extension. In Supabase: Database → Extensions →
-- search "pg_cron" → enable. Then run this file in the SQL Editor.

select cron.schedule(
  'borrow-buddy-due-reminders',
  '0 7 * * *',                      -- every day at 07:00 UTC (09:00 in Finland in winter)
  $$ select public.send_due_reminders(); $$
);

-- To stop it later:
-- select cron.unschedule('borrow-buddy-due-reminders');
