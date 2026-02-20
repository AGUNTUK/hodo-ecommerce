# Coupon & Discount Management System Setup Guide

## Overview
This guide will help you set up the Coupon & Discount Management system.

---

## ⚠️ Run This Safe SQL in Supabase

I've created a **safer version** that handles existing tables. Go to **Supabase Dashboard → SQL Editor** and run:

```sql
-- ============================================
-- COUPON & DISCOUNT MANAGEMENT SYSTEM
-- Safe SQL Schema - Handles existing tables
-- ============================================

-- Create coupons table (safe if already exists)
CREATE TABLE IF NOT EXISTS coupons (
  id SERIAL PRIMARY KEY,
  code VARCHAR(50) NOT NULL UNIQUE,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
  discount_value DECIMAL(10, 2) NOT NULL,
  minimum_order_amount DECIMAL(10, 2) DEFAULT 0,
  maximum_discount_cap DECIMAL(10, 2),
  applicable_type VARCHAR(20) DEFAULT 'all',
  applicable_products INTEGER[],
  applicable_categories VARCHAR(100)[],
  usage_limit INTEGER,
  usage_count INTEGER DEFAULT 0,
  usage_per_customer INTEGER DEFAULT 1,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create coupon_usage table (safe if already exists)
CREATE TABLE IF NOT EXISTS coupon_usage (
  id SERIAL PRIMARY KEY,
  coupon_id INTEGER REFERENCES coupons(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(255),
  order_id INTEGER REFERENCES orders(id) ON DELETE SET NULL,
  used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(coupon_id, user_id),
  UNIQUE(coupon_id, session_id)
);

-- Add columns to orders table (safe if already exists)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'subtotal') THEN
    ALTER TABLE orders ADD COLUMN subtotal DECIMAL(10, 2);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'discount_amount') THEN
    ALTER TABLE orders ADD COLUMN discount_amount DECIMAL(10, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'coupon_code') THEN
    ALTER TABLE orders ADD COLUMN coupon_code VARCHAR(50);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'shipping_cost') THEN
    ALTER TABLE orders ADD COLUMN shipping_cost DECIMAL(10, 2) DEFAULT 0;
  END IF;
END $$;

-- RLS POLICIES FOR COUPONS
ALTER TABLE IF EXISTS coupons ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Coupons are viewable by everyone' AND tablename = 'coupons') THEN
    CREATE POLICY "Coupons are viewable by everyone" ON coupons FOR SELECT USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Only admins can insert coupons' AND tablename = 'coupons') THEN
    CREATE POLICY "Only admins can insert coupons" ON coupons FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Only admins can update coupons' AND tablename = 'coupons') THEN
    CREATE POLICY "Only admins can update coupons" ON coupons FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Only admins can delete coupons' AND tablename = 'coupons') THEN
    CREATE POLICY "Only admins can delete coupons" ON coupons FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');
  END IF;
END $$;

-- RLS POLICIES FOR COUPON USAGE
ALTER TABLE IF EXISTS coupon_usage ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own coupon usage' AND tablename = 'coupon_usage') THEN
    CREATE POLICY "Users can view own coupon usage" ON coupon_usage FOR SELECT USING (auth.uid() = user_id OR session_id IS NOT NULL);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'System can insert coupon usage' AND tablename = 'coupon_usage') THEN
    CREATE POLICY "System can insert coupon usage" ON coupon_usage FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_active ON coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_coupons_expiry ON coupons(expiry_date);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);

-- TRIGGER FOR UPDATED AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_coupons_updated_at ON coupons;
CREATE TRIGGER update_coupons_updated_at BEFORE UPDATE ON coupons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- SAMPLE COUPONS
INSERT INTO coupons (code, description, discount_type, discount_value, minimum_order_amount, usage_limit, start_date, expiry_date, is_active) 
SELECT 'WELCOME10', 'Welcome discount for new customers', 'percentage', 10, 500, 100, NOW(), NOW() + INTERVAL '30 days', true
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'WELCOME10');

INSERT INTO coupons (code, description, discount_type, discount_value, minimum_order_amount, usage_limit, start_date, expiry_date, is_active) 
SELECT 'SAVE50', 'Flat 50 BDT discount', 'fixed', 50, 300, NULL, NOW(), NOW() + INTERVAL '60 days', true
WHERE NOT EXISTS (SELECT 1 FROM coupons WHERE code = 'SAVE50');

-- SUCCESS
SELECT 'Coupon system setup complete!' as status;
```

---

## Files Already Created:

| File | Description |
|------|-------------|
| `admin/coupons-schema.sql` | Safe SQL schema (updated) |
| `admin/discounts.js` | Full coupon management |
| `admin/discounts.html` | Admin page with styles |

---

## What This SQL Does:

✅ Creates `coupons` table (safe if exists)  
✅ Creates `coupon_usage` table (safe if exists)  
✅ Adds columns to `orders` (safe if exist)  
✅ Sets up RLS policies  
✅ Creates indexes  
✅ Adds sample coupons  
✅ Handles errors gracefully  

---

## After Running SQL:

1. Go to `/admin/discounts.html`
2. Click "New Coupon"
3. Create your first coupon
4. Test at checkout!

---

## Common Errors Fixed:

- "relation already exists" → Now uses `IF NOT EXISTS`
- "column already exists" → Now checks first
- "policy already exists" → Now checks first
- "trigger already exists" → Now drops and recreates
