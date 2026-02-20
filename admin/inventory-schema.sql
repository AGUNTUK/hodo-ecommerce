-- ============================================
-- INVENTORY ADJUSTMENT HISTORY LOG
-- Run this in your Supabase SQL Editor
-- ============================================

-- Create adjustment log table
CREATE TABLE IF NOT EXISTS inventory_adjustments (
  id SERIAL PRIMARY KEY,
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  product_name VARCHAR(255) NOT NULL,
  adjustment_type VARCHAR(20) NOT NULL, -- 'increase', 'decrease', 'set'
  quantity INTEGER NOT NULL,
  previous_stock INTEGER NOT NULL,
  new_stock INTEGER NOT NULL,
  reason TEXT,
  admin_user VARCHAR(255) DEFAULT 'Admin',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE inventory_adjustments ENABLE ROW LEVEL SECURITY;

-- Allow all reads (admin panel)
CREATE POLICY "Anyone can view adjustments" ON inventory_adjustments
  FOR SELECT USING (true);

-- Allow all inserts (admin panel - no auth check for simplicity)
CREATE POLICY "Anyone can insert adjustments" ON inventory_adjustments
  FOR INSERT WITH CHECK (true);

-- Index for fast product lookups
CREATE INDEX IF NOT EXISTS idx_inv_adj_product_id ON inventory_adjustments(product_id);
CREATE INDEX IF NOT EXISTS idx_inv_adj_created_at ON inventory_adjustments(created_at DESC);

-- Also ensure products table has stock column (idempotent)
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0;
