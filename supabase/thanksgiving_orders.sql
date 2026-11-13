-- Thanksgiving 2026 pre-orders
CREATE TABLE IF NOT EXISTS thanksgiving_orders (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number     text NOT NULL,
  customer_name    text NOT NULL,
  customer_email   text NOT NULL DEFAULT '',
  customer_address text NOT NULL,
  items            jsonb NOT NULL DEFAULT '[]',
  subtotal         numeric(10,2) NOT NULL DEFAULT 0,
  tax_amount       numeric(10,2) NOT NULL DEFAULT 0,
  total            numeric(10,2) NOT NULL DEFAULT 0,
  special_requests text NOT NULL DEFAULT '',
  stripe_session_id text NOT NULL DEFAULT '',
  status           text NOT NULL DEFAULT 'pending_payment',
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS thanksgiving_orders_status_idx ON thanksgiving_orders(status);
CREATE INDEX IF NOT EXISTS thanksgiving_orders_created_idx ON thanksgiving_orders(created_at);
