-- Invoices table for The Hungry Rooster admin panel
-- Run this in the Supabase SQL editor before using the Invoices tab

CREATE TABLE IF NOT EXISTS invoices (
  id                 UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_number     TEXT NOT NULL,
  customer_name      TEXT NOT NULL,
  customer_email     TEXT NOT NULL DEFAULT '',
  customer_phone     TEXT NOT NULL DEFAULT '',
  customer_company   TEXT NOT NULL DEFAULT '',
  line_items         JSONB NOT NULL DEFAULT '[]',
  notes              TEXT NOT NULL DEFAULT '',
  total              NUMERIC(10,2) NOT NULL DEFAULT 0,
  tax_amount         NUMERIC(10,2) NOT NULL DEFAULT 0,
  delivery_type      TEXT NOT NULL DEFAULT 'pickup',  -- pickup | delivery
  delivery_address   TEXT NOT NULL DEFAULT '',
  delivery_fee       NUMERIC(10,2) NOT NULL DEFAULT 0,
  service_fee        NUMERIC(10,2) NOT NULL DEFAULT 0,
  gratuity           NUMERIC(10,2) NOT NULL DEFAULT 0,
  status             TEXT NOT NULL DEFAULT 'draft',   -- draft | sent | paid | overdue
  payment_method     TEXT NOT NULL DEFAULT '',
  stripe_checkout_url TEXT NOT NULL DEFAULT '',
  stripe_session_id  TEXT NOT NULL DEFAULT '',
  due_date           DATE,
  paid_at            TIMESTAMPTZ,
  sales_rep          TEXT NOT NULL DEFAULT 'house',   -- house | abigayle | jordona
  commission_rate    NUMERIC(5,2) NOT NULL DEFAULT 0,
  commission_amount  NUMERIC(10,2) NOT NULL DEFAULT 0,
  created_at         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;

-- Allow public reads (admin panel uses anon key)
CREATE POLICY "Allow public read on invoices"
  ON invoices FOR SELECT
  USING (true);

-- Allow inserts and updates from the anon key (admin is password-protected)
CREATE POLICY "Allow public insert on invoices"
  ON invoices FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update on invoices"
  ON invoices FOR UPDATE
  USING (true);
