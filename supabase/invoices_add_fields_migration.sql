-- Add delivery, fees, and gratuity fields to invoices table
-- Run this in Supabase SQL editor if the invoices table already exists
-- If running invoices_migration.sql fresh, this is already included there — skip this file.

ALTER TABLE invoices
  ADD COLUMN IF NOT EXISTS delivery_type     TEXT NOT NULL DEFAULT 'pickup',
  ADD COLUMN IF NOT EXISTS delivery_address  TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS delivery_fee      NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS service_fee       NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS gratuity          NUMERIC(10,2) NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS tax_amount        NUMERIC(10,2) NOT NULL DEFAULT 0;
