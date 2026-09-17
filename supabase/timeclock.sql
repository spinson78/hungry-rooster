-- Timeclock: employees + time entries
-- Run this in Supabase SQL editor

CREATE TABLE IF NOT EXISTS employees (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  name         TEXT    NOT NULL,
  hourly_rate  NUMERIC(10,2) NOT NULL DEFAULT 0,
  token        TEXT    NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  is_active    BOOLEAN NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS time_entries (
  id           UUID    DEFAULT gen_random_uuid() PRIMARY KEY,
  employee_id  UUID    NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  clock_in     TIMESTAMPTZ NOT NULL,
  clock_out    TIMESTAMPTZ,
  notes        TEXT    NOT NULL DEFAULT '',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE time_entries DISABLE ROW LEVEL SECURITY;
