-- Add item_statuses column to orders for per-item kitchen completion tracking
ALTER TABLE orders ADD COLUMN IF NOT EXISTS item_statuses JSONB DEFAULT '{}';
