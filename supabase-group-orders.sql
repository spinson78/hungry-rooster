-- Run this in your Supabase SQL Editor
-- Safe to re-run: uses IF NOT EXISTS so it won't error if tables already exist

create table if not exists group_locations (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  address text not null,
  slug text unique not null,
  is_active boolean default true,
  created_at timestamp with time zone default now()
);
alter table group_locations disable row level security;

create table if not exists group_orders (
  id uuid default gen_random_uuid() primary key,
  location_id uuid references group_locations(id),
  location_slug text not null,
  person_name text not null,
  items jsonb not null,
  total numeric not null,
  special_requests text,
  delivery_date date not null,
  status text default 'pending',
  stripe_session_id text,
  created_at timestamp with time zone default now()
);
alter table group_orders disable row level security;

-- Placeholder locations (replace names/addresses with your real clients)
-- Uses ON CONFLICT DO NOTHING so re-running won't duplicate rows
insert into group_locations (name, address, slug) values
  ('Acme Corporation', '123 Business Blvd, Dallas, TX 75201', 'acme-corp'),
  ('Dallas Medical Center', '456 Health Way, Dallas, TX 75204', 'dallas-medical'),
  ('Greenville Academy', '789 School Dr, Dallas, TX 75206', 'greenville-academy'),
  ('North Dallas Office Park', '321 Corporate Dr, Dallas, TX 75248', 'north-dallas-office')
on conflict (slug) do nothing;
