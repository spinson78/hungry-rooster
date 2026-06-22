-- Pre-order scheduling: add scheduled_for to orders table
-- Run this in your Supabase SQL editor
-- NULL = ASAP order   |   non-null = customer-chosen future date/time

ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
