-- ============================================================
-- THE COOP — Fred's Bucks System
-- Run in Supabase SQL Editor
-- ============================================================

CREATE TABLE IF NOT EXISTS fred_bucks_purchases (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  teacher_name      TEXT NOT NULL,
  teacher_email     TEXT NOT NULL,
  school_name       TEXT,
  amount_paid       NUMERIC(10,2) NOT NULL,
  coupons_total     INTEGER NOT NULL,
  coupons_redeemed  INTEGER DEFAULT 0,
  stripe_session_id TEXT,
  ref_code          TEXT UNIQUE NOT NULL,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS fred_bucks_redemptions (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  purchase_id UUID REFERENCES fred_bucks_purchases(id) ON DELETE SET NULL,
  teacher_name TEXT NOT NULL,
  quantity    INTEGER NOT NULL DEFAULT 1,
  value       NUMERIC(10,2) NOT NULL,
  note        TEXT,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS fb_purchases_email_idx  ON fred_bucks_purchases(teacher_email);
CREATE INDEX IF NOT EXISTS fb_purchases_ref_idx    ON fred_bucks_purchases(ref_code);
CREATE INDEX IF NOT EXISTS fb_redemptions_pid_idx  ON fred_bucks_redemptions(purchase_id);
CREATE INDEX IF NOT EXISTS fb_redemptions_date_idx ON fred_bucks_redemptions(created_at DESC);
