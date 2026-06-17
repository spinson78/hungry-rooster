-- Run this in your Supabase SQL Editor
-- Adds delivery_fee and delivery_distance_miles to the orders table
-- Both are used for tax reporting and IRS mileage write-offs

alter table orders
  add column if not exists delivery_fee numeric default 0;

alter table orders
  add column if not exists delivery_distance_miles numeric default 0;

-- After running this, your orders table will record:
--   delivery_fee            → amount charged to the customer for delivery
--   delivery_distance_miles → straight-line distance (miles) from THR to delivery address
--
-- Use these for:
--   • Sales tax reporting on delivery charges
--   • IRS Schedule C mileage deduction (actual miles are typically 2× the straight-line distance)
--   • Year-end delivery revenue summary
