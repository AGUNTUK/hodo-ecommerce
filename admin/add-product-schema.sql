-- ============================================
-- ADD PRODUCT - Schema Migration
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Add missing columns to products table
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS discount_price DECIMAL(10, 2) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS sku VARCHAR(100) DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS stock INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS video_url TEXT DEFAULT NULL;

-- Step 2: Add a unique constraint on SKU (optional, only if SKU is provided)
-- We allow NULL SKUs, but non-null ones should be unique
CREATE UNIQUE INDEX IF NOT EXISTS idx_products_sku_unique
  ON products(sku)
  WHERE sku IS NOT NULL;

-- Step 3: Create the product-media storage bucket (if not using Supabase Dashboard)
-- If you prefer to create it via Dashboard: Storage → New bucket → name: product-media → Public: ✅
-- Alternatively run this (requires storage extension):
-- INSERT INTO storage.buckets (id, name, public) VALUES ('product-media', 'product-media', true)
-- ON CONFLICT (id) DO NOTHING;

-- Step 4: Set storage RLS policies for product-media bucket (run after creating bucket)
-- Allow anyone to view files
-- CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING (bucket_id = 'product-media');
-- Allow authenticated users to upload
-- CREATE POLICY "Auth Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'product-media');

-- Step 5: Verify the changes
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'products'
ORDER BY ordinal_position;
