-- Migration: add alerts.last_dayof_notified.
--
-- send-moon-alerts now sends two notifications per lunar cycle: the existing
-- advance heads-up (throttled via last_notified) plus a day-of "tonight"
-- reminder on the optimal night itself, throttled independently via this
-- column. Run once against an existing database; idempotent.
ALTER TABLE alerts
  ADD COLUMN IF NOT EXISTS last_dayof_notified TIMESTAMP WITH TIME ZONE;
