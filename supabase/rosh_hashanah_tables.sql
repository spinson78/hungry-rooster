-- ============================================================
-- The Hungry Rooster — Rosh Hashanah Orders 2026
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS rosh_hashanah_orders (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  stripe_session_id   TEXT UNIQUE,
  customer_name       TEXT,
  customer_email      TEXT,
  customer_phone      TEXT,
  customer_address    TEXT,
  special_requests    TEXT,
  boxes_summary       TEXT,   -- e.g. "1× 2 Person, 2× 4-6 Person"
  addons_summary      TEXT,   -- e.g. "2× Salmon, 1× Honey Cake"
  items               JSONB,
  subtotal            NUMERIC(10,2),
  tax_amount          NUMERIC(10,2),
  tip_amount          NUMERIC(10,2),
  total               NUMERIC(10,2),
  status              TEXT DEFAULT 'paid',
  delivery_date       TEXT DEFAULT '2026-09-11',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rosh_hashanah_orders DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS rh_orders_session_idx ON rosh_hashanah_orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS rh_orders_created_idx ON rosh_hashanah_orders(created_at DESC);
