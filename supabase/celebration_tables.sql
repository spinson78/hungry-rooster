-- ── Coop Celebration Orders ───────────────────────────────────────────────────
-- Covers: froyo, cupcakes, celebration pack (ordered online or via POS)

CREATE TABLE IF NOT EXISTS celebration_orders (
  id                  UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  order_type          TEXT        NOT NULL CHECK (order_type IN ('froyo', 'cupcakes', 'celebration_pack')),

  -- Customer info
  purchaser_name      TEXT        NOT NULL,
  classroom           TEXT        NOT NULL,
  kids_name           TEXT,                         -- cupcakes / celebration pack

  -- Delivery
  delivery_date       DATE        NOT NULL,
  delivery_time       TEXT        NOT NULL,

  -- Product details
  student_count       INTEGER,                      -- froyo: how many students
  quantity            INTEGER     DEFAULT 1,        -- cupcakes: dozens; pack: packs
  cupcake_flavor      TEXT,                         -- 'chocolate' | 'vanilla'
  toppings            TEXT[],                       -- celebration pack: up to 2 choices

  -- Order meta
  special_requests    TEXT,
  source              TEXT        DEFAULT 'online', -- 'online' | 'pos'
  payment_method      TEXT,                         -- 'stripe' | 'cash' | 'card' | 'account'
  stripe_session_id   TEXT        UNIQUE,
  subtotal            NUMERIC(10,2),
  tax_amount          NUMERIC(10,2),
  total               NUMERIC(10,2),
  status              TEXT        DEFAULT 'pending',
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE celebration_orders DISABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_celebration_orders_delivery_date ON celebration_orders (delivery_date);
CREATE INDEX IF NOT EXISTS idx_celebration_orders_created_at   ON celebration_orders (created_at DESC);
