-- Add scheduled_for to support pre-order scheduling
-- NULL = ASAP order; non-null = future pickup/delivery time chosen by customer
ALTER TABLE orders ADD COLUMN IF NOT EXISTS scheduled_for TIMESTAMPTZ;
