CREATE TABLE IF NOT EXISTS school_accounts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  student_name TEXT NOT NULL,
  student_pin TEXT UNIQUE NOT NULL,
  grade_class TEXT,
  school_name TEXT DEFAULT 'School',
  parent_name TEXT NOT NULL,
  parent_email TEXT NOT NULL,
  parent_phone TEXT,
  billing_preference TEXT DEFAULT 'invoice' CHECK (billing_preference IN ('auto_charge', 'invoice')),
  stripe_customer_id TEXT,
  stripe_payment_method_id TEXT,
  stripe_setup_session_id TEXT,
  balance NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'pending_setup' CHECK (status IN ('active', 'frozen', 'pending_setup')),
  freeze_reason TEXT,
  registration_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  notes TEXT
);

CREATE TABLE IF NOT EXISTS school_transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  account_id UUID REFERENCES school_accounts(id) ON DELETE SET NULL,
  type TEXT NOT NULL CHECK (type IN ('purchase','card_sale','cash_sale','payment','adjustment','billing_charge','billing_invoice')),
  amount NUMERIC(10,2) NOT NULL,
  description TEXT,
  items JSONB,
  stripe_payment_intent_id TEXT,
  stripe_invoice_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS school_coffee_menu (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC(10,2) NOT NULL,
  category TEXT DEFAULT 'Drinks',
  emoji TEXT DEFAULT '☕',
  available BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS school_accounts_pin_idx ON school_accounts(student_pin);
CREATE INDEX IF NOT EXISTS school_accounts_email_idx ON school_accounts(parent_email);
CREATE INDEX IF NOT EXISTS school_accounts_status_idx ON school_accounts(status);
CREATE INDEX IF NOT EXISTS school_txn_account_idx ON school_transactions(account_id);
CREATE INDEX IF NOT EXISTS school_txn_created_idx ON school_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS school_menu_sort_idx ON school_coffee_menu(sort_order, available);
