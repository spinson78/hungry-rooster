-- Run this in Supabase SQL Editor
-- Tracks which orders have been sent to the printer so the Pi doesn't re-print
ALTER TABLE orders ADD COLUMN IF NOT EXISTS printed_at TIMESTAMPTZ NULL;
