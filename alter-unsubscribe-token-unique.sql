-- Migration: make alerts.unsubscribe_token present and unique.
--
-- The unsubscribe / manage edge functions resolve a user from a single token
-- via `.single()`, which fails (404) if a token maps to 0 or >1 rows. Uniqueness
-- was previously only implied by the gen_random_uuid() default, not enforced.
-- Run once against an existing database; idempotent.

-- 1. Backfill any rows missing a token (older rows / manual inserts).
UPDATE alerts
SET unsubscribe_token = gen_random_uuid()
WHERE unsubscribe_token IS NULL;

-- 2. Require a token on every alert (safe to re-run; no-op if already NOT NULL).
ALTER TABLE alerts ALTER COLUMN unsubscribe_token SET NOT NULL;

-- 3. Add the UNIQUE constraint if it is not already present.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'alerts_unsubscribe_token_key'
  ) THEN
    ALTER TABLE alerts
      ADD CONSTRAINT alerts_unsubscribe_token_key UNIQUE (unsubscribe_token);
  END IF;
END $$;
