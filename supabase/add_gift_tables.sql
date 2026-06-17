-- ============================================================
-- The Hungry Rooster — Gift Cards & Dinner Gifts
-- Run in Supabase SQL Editor
-- ============================================================

-- Dollar-amount gift cards
create table if not exists gift_cards (
  id uuid default gen_random_uuid() primary key,
  code text unique not null,
  amount_cents integer not null,
  balance_cents integer not null,
  purchaser_name text,
  purchaser_email text,
  recipient_name text,
  recipient_email text,
  message text,
  stripe_session_id text,
  created_at timestamptz default now(),
  status text default 'active' -- active, depleted, expired
);

-- Dinner gifts (scheduled delivery OR claim coupon)
create table if not exists dinner_gifts (
  id uuid default gen_random_uuid() primary key,
  gift_type text not null check (gift_type in ('scheduled', 'claim_code')),
  claim_code text unique,                    -- for claim_code type
  package_name text not null,
  package_price_cents integer not null,
  serves text,                               -- e.g. "Serves 2", "Serves 4"
  purchaser_name text,
  purchaser_email text,
  recipient_name text,
  recipient_email text,
  recipient_phone text,
  message text,
  -- scheduled delivery fields
  delivery_date date,
  delivery_address text,
  delivery_city_zip text,
  -- claim tracking
  claimed_at timestamptz,
  claim_delivery_date date,
  claim_delivery_address text,
  claim_delivery_city_zip text,
  -- admin tracking
  stripe_session_id text,
  notes text,
  created_at timestamptz default now(),
  status text default 'pending'              -- pending, claimed, delivered, cancelled
);

-- Index for quick code lookups
create index if not exists gift_cards_code_idx on gift_cards(code);
create index if not exists dinner_gifts_claim_code_idx on dinner_gifts(claim_code);
