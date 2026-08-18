-- THE COOP by The Hungry Rooster — Menu Seed
-- Run this in the Supabase SQL Editor after creating school_coffee_menu table.
-- Safe to re-run: clears existing menu items first.

DELETE FROM school_coffee_menu;

INSERT INTO school_coffee_menu (name, price, category, emoji, available, sort_order) VALUES

-- ── Drinks ──────────────────────────────────────────────────────────────
('Coffee',    1.00, 'Drinks', '☕', true,  1),
('Hot Tea',   1.00, 'Drinks', '🍵', true,  2),
('Can Soda',  2.00, 'Drinks', '🥤', true,  3),
('Water',     2.00, 'Drinks', '💧', true,  4),
('Sweet Tea', 3.00, 'Drinks', '🧋', true,  5),
('Latte',     4.00, 'Drinks', '☕', true,  6),
('Cold Brew', 4.00, 'Drinks', '🧊', true,  7),
('Frappe',    5.00, 'Drinks', '🥛', true,  8),

-- ── Food ────────────────────────────────────────────────────────────────
('Chips',           2.00,  'Food', '🍟', true,  10),
('Pastry',          4.00,  'Food', '🥐', true,  11),
('Pretzel',         4.00,  'Food', '🥨', true,  12),
('Frozen Yogurt',   5.00,  'Food', '🍦', true,  13),
('Burrito',         5.00,  'Food', '🌯', true,  14),
('Protein Side',    6.00,  'Food', '🥩', true,  15),
('Eggrolls',        8.00,  'Food', '🥢', true,  16),
('Cheese Sticks',   8.00,  'Food', '🧀', true,  17),
('Grab n Go Pasta', 8.00,  'Food', '🍝', true,  18),
('Grab n Go Nuggets',8.00, 'Food', '🍗', true,  19),
('Supreme Burrito', 8.00,  'Food', '🌯', true,  20),
('Hot Sandwich',    10.00, 'Food', '🥪', true,  21),
('Grab n Go Wrap',  15.00, 'Food', '🌯', true,  22),
('Grab n Go Salad', 15.00, 'Food', '🥗', true,  23),

-- ── Shabbat (Friday Only) ────────────────────────────────────────────────
('Challah',        6.50,  'Shabbat', '🍞', true,  30),
('Dressing or Dip', 6.50, 'Shabbat', '🫙', true,  31),
('Babka',          18.00, 'Shabbat', '🍫', true,  32);
