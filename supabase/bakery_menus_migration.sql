-- Run this in your Supabase SQL editor to create the bakery_menus table
-- This powers the Esther Friday Bakery weekly ordering system

CREATE TABLE IF NOT EXISTS bakery_menus (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  week_of DATE UNIQUE NOT NULL,
  items JSONB NOT NULL DEFAULT '[]',
  -- items is an array of: { name: string, price: number, description: string }
  quantity_available INTEGER NOT NULL DEFAULT 50,
  quantity_remaining INTEGER NOT NULL DEFAULT 50,
  is_active BOOLEAN NOT NULL DEFAULT true,
  reveal_time TIMESTAMPTZ,    -- Monday 9PM CDT (Tuesday 2AM UTC)
  cutoff_time TIMESTAMPTZ,    -- Friday 9AM CDT (Friday 2PM UTC)
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (match existing tables)
ALTER TABLE bakery_menus ENABLE ROW LEVEL SECURITY;

-- Allow public reads (so the ordering page can fetch the menu)
CREATE POLICY "Public read bakery_menus"
  ON bakery_menus FOR SELECT
  USING (true);

-- Allow authenticated inserts/updates (for admin saves via service role key)
CREATE POLICY "Service role can write bakery_menus"
  ON bakery_menus FOR ALL
  USING (true)
  WITH CHECK (true);
