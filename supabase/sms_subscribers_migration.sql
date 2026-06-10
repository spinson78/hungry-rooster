-- SMS Subscribers table for The Hungry Rooster
-- Run this in the Supabase SQL editor

CREATE TABLE IF NOT EXISTS sms_subscribers (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phone       TEXT NOT NULL,
  name        TEXT NOT NULL DEFAULT '',
  source      TEXT NOT NULL DEFAULT 'order',  -- 'owner_import' | 'order'
  opted_in_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  active      BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(phone)
);

ALTER TABLE sms_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read on sms_subscribers"
  ON sms_subscribers FOR SELECT USING (true);

CREATE POLICY "Allow public insert on sms_subscribers"
  ON sms_subscribers FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update on sms_subscribers"
  ON sms_subscribers FOR UPDATE USING (true);
