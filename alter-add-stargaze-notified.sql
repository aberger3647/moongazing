-- Migration: add alerts.last_stargaze_notified and last_stargaze_dayof_notified.
--
-- send-moon-alerts now also sends a "stargazing" alert on clear new-moon nights
-- (darkest skies) in addition to the existing full-moon "moon gazing" alert.
-- The two must throttle independently: full moon and new moon are only ~14.75
-- days apart, so if they shared last_notified / last_dayof_notified the
-- RENOTIFY_DAYS (25) throttle would let one suppress the other. These columns
-- are the stargazing counterparts of last_notified / last_dayof_notified.
-- Run once against an existing database; idempotent.
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS last_stargaze_notified TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS last_stargaze_dayof_notified TIMESTAMP WITH TIME ZONE;
