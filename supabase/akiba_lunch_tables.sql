-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS akiba_lunch_orders (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  item_name TEXT NOT NULL,
  item_price NUMERIC(10,2) NOT NULL,
  make_it_meal BOOLEAN DEFAULT FALSE,
  drink TEXT,
  amount_total NUMERIC(10,2) NOT NULL,
  stripe_session_id TEXT UNIQUE,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'archived')),
  week_of DATE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE akiba_lunch_orders DISABLE ROW LEVEL SECURITY;
