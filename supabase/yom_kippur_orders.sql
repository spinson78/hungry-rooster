-- Run this in the Supabase SQL editor to create the Yom Kippur orders table

CREATE TABLE IF NOT EXISTS yom_kippur_orders (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_number      TEXT NOT NULL,
  customer_name     TEXT NOT NULL,
  customer_email    TEXT NOT NULL,
  customer_phone    TEXT NOT NULL,
  customer_address  TEXT NOT NULL DEFAULT '',
  package           TEXT NOT NULL,
  addons            JSONB NOT NULL DEFAULT '[]',
  subtotal          NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  tip_amount        NUMERIC(10,2) NOT NULL DEFAULT 0,
  total             NUMERIC(10,2) NOT NULL DEFAULT 0,
  fulfillment_type  TEXT NOT NULL DEFAULT 'pickup',
  special_requests  TEXT NOT NULL DEFAULT '',
  stripe_session_id TEXT NOT NULL DEFAULT '',
  status            TEXT NOT NULL DEFAULT 'pending_payment',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE yom_kippur_orders DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_yk_stripe ON yom_kippur_orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS idx_yk_status ON yom_kippur_orders(status);
