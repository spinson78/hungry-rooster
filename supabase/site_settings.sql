CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '[]',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE site_settings DISABLE ROW LEVEL SECURITY;

-- Default rows
INSERT INTO site_settings (key, value) VALUES
  ('closed_dates', '[]'),
  ('sold_out_items', '[]')
ON CONFLICT (key) DO NOTHING;
