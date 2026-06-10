-- SMS opt-in migration for The Hungry Rooster
-- Run this in the Supabase SQL editor

ALTER TABLE orders ADD COLUMN IF NOT EXISTS sms_opted_in BOOLEAN NOT NULL DEFAULT false;
