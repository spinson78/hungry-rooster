-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS catering_inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  event_date TEXT,
  headcount TEXT,
  event_type TEXT,
  location TEXT,
  budget TEXT,
  notes TEXT,
  responded BOOLEAN NOT NULL DEFAULT false,
  responded_at TIMESTAMPTZ,
  responded_by TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE catering_inquiries DISABLE ROW LEVEL SECURITY;
