-- THE COOP Challah & Babka Pre-Order System
-- Run in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS coopchallah_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  order_type TEXT NOT NULL CHECK (order_type IN ('weekly', 'semester1', 'semester2', 'fullyear')),
  package TEXT NOT NULL,
  babka_flavor TEXT CHECK (babka_flavor IN ('cinnamon', 'chocolate')),
  amount_total NUMERIC(10,2) NOT NULL,
  is_installment BOOLEAN DEFAULT FALSE,
  installments_paid INTEGER DEFAULT 0,
  installments_total INTEGER DEFAULT 1,
  stripe_customer_id TEXT,
  stripe_payment_method_id TEXT,
  stripe_session_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS coopchallah_installments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES coopchallah_orders(id) ON DELETE CASCADE,
  installment_number INTEGER NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  due_date DATE NOT NULL,
  paid_at TIMESTAMPTZ,
  stripe_payment_intent_id TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS challah_orders_type_idx ON coopchallah_orders(order_type, status);
CREATE INDEX IF NOT EXISTS challah_orders_session_idx ON coopchallah_orders(stripe_session_id);
CREATE INDEX IF NOT EXISTS challah_installments_order_idx ON coopchallah_installments(order_id);
CREATE INDEX IF NOT EXISTS challah_installments_due_idx ON coopchallah_installments(due_date, status);

-- Disable RLS for staff access
ALTER TABLE coopchallah_orders DISABLE ROW LEVEL SECURITY;
ALTER TABLE coopchallah_installments DISABLE ROW LEVEL SECURITY;
