-- Hodo E-commerce Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- ============================================
-- PRODUCTS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS products (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100) NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  rating DECIMAL(2, 1) DEFAULT 4.5,
  sizes TEXT[] NOT NULL,
  colors TEXT[] NOT NULL,
  image TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on products
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Products are readable by everyone
CREATE POLICY "Products are viewable by everyone" ON products
  FOR SELECT USING (true);

-- Only authenticated users with admin role can insert/update/delete
CREATE POLICY "Only admins can insert products" ON products
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update products" ON products
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete products" ON products
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- PROFILES TABLE (User Data)
-- ============================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  name VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  role VARCHAR(50) DEFAULT 'customer',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can view their own profile
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile" ON profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- ============================================
-- CART TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS cart (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255), -- For guest users
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  size VARCHAR(10) NOT NULL,
  color VARCHAR(50) NOT NULL,
  quantity INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id, size, color),
  UNIQUE(session_id, product_id, size, color)
);

-- Enable RLS on cart
ALTER TABLE cart ENABLE ROW LEVEL SECURITY;

-- Users can view their own cart items (authenticated users or guest sessions)
CREATE POLICY "Users can view own cart" ON cart
  FOR SELECT USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Users can insert their own cart items
CREATE POLICY "Users can insert own cart items" ON cart
  FOR INSERT WITH CHECK (auth.uid() = user_id OR session_id IS NOT NULL);

-- Users can update their own cart items
CREATE POLICY "Users can update own cart items" ON cart
  FOR UPDATE USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- Users can delete their own cart items
CREATE POLICY "Users can delete own cart items" ON cart
  FOR DELETE USING (auth.uid() = user_id OR session_id IS NOT NULL);

-- ============================================
-- ORDERS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id VARCHAR(255), -- For guest orders
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(50),
  customer_address TEXT,
  subtotal DECIMAL(10, 2),
  discount_amount DECIMAL(10, 2) DEFAULT 0,
  coupon_code VARCHAR(50),
  shipping_cost DECIMAL(10, 2) DEFAULT 0,
  total_amount DECIMAL(10, 2) NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on orders
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Users can view their own orders
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

-- Users can create orders
CREATE POLICY "Users can create orders" ON orders
  FOR INSERT WITH CHECK (true);

-- ============================================
-- ORDER ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  product_id INTEGER REFERENCES products(id) ON DELETE SET NULL,
  product_name VARCHAR(255) NOT NULL,
  size VARCHAR(10) NOT NULL,
  color VARCHAR(50) NOT NULL,
  quantity INTEGER NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on order_items
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

-- Users can view items in their own orders
CREATE POLICY "Users can view own order items" ON order_items
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
    )
  );

-- ============================================
-- WISHLIST TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS wishlist (
  id SERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id VARCHAR(255), -- For guest users
  product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, product_id),
  UNIQUE(session_id, product_id)
);

-- Enable RLS on wishlist
ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;

-- Users can view their own wishlist
CREATE POLICY "Users can view own wishlist" ON wishlist
  FOR SELECT USING (auth.uid() = user_id);

-- Users can insert their own wishlist items
CREATE POLICY "Users can insert own wishlist items" ON wishlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can delete their own wishlist items
CREATE POLICY "Users can delete own wishlist items" ON wishlist
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- HERO SLIDES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS hero_slides (
  id SERIAL PRIMARY KEY,
  eyebrow VARCHAR(255),
  title TEXT NOT NULL,
  description TEXT,
  button_text VARCHAR(100),
  button_link VARCHAR(255),
  secondary_button_text VARCHAR(100),
  secondary_button_link VARCHAR(255),
  image TEXT NOT NULL,
  "order" INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on hero_slides
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

-- Hero slides are readable by everyone
CREATE POLICY "Hero slides are viewable by everyone" ON hero_slides
  FOR SELECT USING (true);

-- Only admins can insert/update/delete hero slides
CREATE POLICY "Only admins can insert hero slides" ON hero_slides
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update hero slides" ON hero_slides
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete hero slides" ON hero_slides
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- ============================================
-- INDEXES FOR BETTER PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_cart_user_id ON cart(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_session_id ON cart(session_id);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_orders_user_id ON orders(user_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);

-- ============================================
-- FUNCTIONS AND TRIGGERS
-- ============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers for updated_at
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cart_updated_at BEFORE UPDATE ON cart
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- SEED INITIAL PRODUCTS DATA
-- ============================================
INSERT INTO products (name, category, price, rating, sizes, colors, image, description) VALUES
('Apex Structured Shirt', 'Shirts', 129.00, 4.8, ARRAY['S', 'M', 'L', 'XL'], ARRAY['Black', 'White', 'Red'], 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=900&q=80', 'Engineered cotton shirt with a tailored silhouette and low-profile seam lines.'),
('Vector Utility Jacket', 'Jackets', 219.00, 4.9, ARRAY['M', 'L', 'XL'], ARRAY['Black', 'Gray', 'Navy'], 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=900&q=80', 'Water-resistant shell jacket with minimalist hardware and modern structured collar.'),
('Monolith Tapered Pants', 'Pants', 149.00, 4.7, ARRAY['S', 'M', 'L', 'XL'], ARRAY['Black', 'Gray', 'Olive'], 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?auto=format&fit=crop&w=900&q=80', 'Tapered technical trousers with subtle pleat detail and soft stretch movement.'),
('Orbit Leather Belt', 'Accessories', 79.00, 4.6, ARRAY['M', 'L', 'XL'], ARRAY['Black', 'Brown', 'Red'], 'https://images.unsplash.com/photo-1560343776-97e7d202ff0e?auto=format&fit=crop&w=900&q=80', 'Premium leather belt with matte black buckle and understated angular profile.'),
('Noir Compression Tee', 'Shirts', 89.00, 4.5, ARRAY['S', 'M', 'L', 'XL'], ARRAY['Black', 'White', 'Gray'], 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=900&q=80', 'Soft compression knit tee designed for layering and sharp monochrome styling.'),
('Titan Bomber Jacket', 'Jackets', 249.00, 4.9, ARRAY['M', 'L', 'XL'], ARRAY['Black', 'Navy', 'Red'], 'https://images.unsplash.com/photo-1614251055880-ee96e4803393?auto=format&fit=crop&w=900&q=80', 'Insulated bomber with tonal ribbing, clean paneling, and a precision cropped fit.'),
('Axis Pleated Trouser', 'Pants', 159.00, 4.7, ARRAY['S', 'M', 'L', 'XL'], ARRAY['Gray', 'Navy', 'Black'], 'https://images.unsplash.com/photo-1593032465171-8bd65299489c?auto=format&fit=crop&w=900&q=80', 'Pleated trouser with architectural drape and refined ankle taper for modern outfits.'),
('Core Minimal Watch', 'Accessories', 189.00, 4.8, ARRAY['M', 'L'], ARRAY['Black', 'Silver', 'Red'], 'https://images.unsplash.com/photo-1523170335258-f5ed11844a49?auto=format&fit=crop&w=900&q=80', 'Clean-faced analog watch with metal casing, matte strap, and subtle red accents.'),
('Urban Polo Shirt', 'Shirts', 99.00, 4.6, ARRAY['S', 'M', 'L', 'XL'], ARRAY['Navy', 'White', 'Black'], 'https://images.unsplash.com/photo-1625910513413-5fc45e60e5e2?auto=format&fit=crop&w=900&q=80', 'Classic polo with modern fit, breathable cotton pique fabric for everyday comfort.'),
('Denim Trucker Jacket', 'Jackets', 189.00, 4.8, ARRAY['S', 'M', 'L', 'XL'], ARRAY['Navy', 'Black', 'Gray'], 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?auto=format&fit=crop&w=900&q=80', 'Authentic denim jacket with vintage wash, perfect for layering in any season.'),
('Slim Fit Chinos', 'Pants', 119.00, 4.5, ARRAY['S', 'M', 'L', 'XL'], ARRAY['Olive', 'Navy', 'Brown'], 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80', 'Versatile slim-fit chinos with stretch comfort, ideal for casual and smart-casual looks.'),
('Canvas Sneakers', 'Footwear', 149.00, 4.7, ARRAY['M', 'L', 'XL'], ARRAY['White', 'Black', 'Navy'], 'https://images.unsplash.com/photo-1525966222134-fcfa99b8ae77?auto=format&fit=crop&w=900&q=80', 'Lightweight canvas sneakers with cushioned insole for all-day comfort.'),
('Casual Linen Shirt', 'Shirts', 109.00, 4.4, ARRAY['S', 'M', 'L', 'XL'], ARRAY['White', 'Olive', 'Navy'], 'https://images.unsplash.com/photo-1598033129183-c4f50c736f10?auto=format&fit=crop&w=900&q=80', 'Breathable linen shirt perfect for warm weather, relaxed fit for casual elegance.'),
('Leather Chelsea Boots', 'Footwear', 279.00, 4.9, ARRAY['M', 'L', 'XL'], ARRAY['Brown', 'Black'], 'https://images.unsplash.com/photo-1638247025967-b4e38f787b76?auto=format&fit=crop&w=900&q=80', 'Classic Chelsea boots in premium leather, timeless style for the modern gentleman.'),
('Wool Blend Sweater', 'Sweaters', 169.00, 4.6, ARRAY['S', 'M', 'L', 'XL'], ARRAY['Gray', 'Navy', 'Olive'], 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?auto=format&fit=crop&w=900&q=80', 'Soft wool blend sweater with ribbed cuffs, perfect for layering in cooler weather.'),
('Cargo Joggers', 'Pants', 129.00, 4.5, ARRAY['S', 'M', 'L', 'XL'], ARRAY['Black', 'Olive', 'Gray'], 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?auto=format&fit=crop&w=900&q=80', 'Modern cargo joggers with utility pockets and elastic cuffs for casual comfort.'),
('Leather Messenger Bag', 'Accessories', 249.00, 4.8, ARRAY['M', 'L'], ARRAY['Brown', 'Black'], 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&w=900&q=80', 'Handcrafted leather messenger bag with multiple compartments for everyday carry.'),
('Graphic Print Hoodie', 'Sweaters', 139.00, 4.4, ARRAY['S', 'M', 'L', 'XL'], ARRAY['Black', 'Gray', 'Navy'], 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&w=900&q=80', 'Premium cotton hoodie with unique graphic print, cozy fit for casual days.'),
('Suede Loafers', 'Footwear', 199.00, 4.7, ARRAY['M', 'L', 'XL'], ARRAY['Brown', 'Navy', 'Gray'], 'https://images.unsplash.com/photo-1614252369475-531eba835eb1?auto=format&fit=crop&w=900&q=80', 'Elegant suede loafers with cushioned footbed, perfect for smart-casual occasions.'),
('Quilted Vest', 'Jackets', 159.00, 4.5, ARRAY['S', 'M', 'L', 'XL'], ARRAY['Navy', 'Black', 'Olive'], 'https://images.unsplash.com/photo-1544923246-77307dd628b0?auto=format&fit=crop&w=900&q=80', 'Lightweight quilted vest for layering, provides warmth without bulk.'),
('Oxford Button-Down', 'Shirts', 119.00, 4.7, ARRAY['S', 'M', 'L', 'XL'], ARRAY['White', 'Navy', 'Gray'], 'https://images.unsplash.com/photo-1594938298603-c8148c4dae35?auto=format&fit=crop&w=900&q=80', 'Classic Oxford button-down in premium cotton, versatile for any occasion.'),
('Aviator Sunglasses', 'Accessories', 129.00, 4.6, ARRAY['M', 'L'], ARRAY['Black', 'Silver', 'Brown'], 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?auto=format&fit=crop&w=900&q=80', 'Timeless aviator sunglasses with UV protection, a must-have accessory.'),
('Relaxed Fit Jeans', 'Pants', 139.00, 4.5, ARRAY['S', 'M', 'L', 'XL'], ARRAY['Navy', 'Black', 'Gray'], 'https://images.unsplash.com/photo-1542272604-787c3835535d?auto=format&fit=crop&w=900&q=80', 'Comfortable relaxed-fit jeans with classic five-pocket styling.'),
('Cashmere Beanie', 'Accessories', 69.00, 4.8, ARRAY['M', 'L'], ARRAY['Gray', 'Navy', 'Black'], 'https://images.unsplash.com/photo-1576871337622-98d48d1cf531?auto=format&fit=crop&w=900&q=80', 'Luxuriously soft cashmere beanie for cold weather comfort and style.');

-- ============================================
-- SEED INITIAL HERO SLIDES DATA
-- ============================================
INSERT INTO hero_slides (eyebrow, title, description, button_text, button_link, secondary_button_text, secondary_button_link, image, "order", is_active) VALUES
('New Collection 2026', 'Elevate Your <span>Style</span>', 'Premium menswear crafted for the modern gentleman. Discover our latest collection of refined essentials.', 'Shop Now', '#shopGrid', 'Contact Us', '#contact-panel', 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=600&q=80', 1, true),
('Summer Essentials', 'Sharp Looks for <span>Hot Days</span>', 'Lightweight fabrics meet bold designs. Stay cool and stylish this summer.', 'Explore Summer', 'shop.html?category=Shirts', 'View Lookbook', '#', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=600&q=80', 2, true),
('Limited Edition', 'Exclusive <span>Jackets</span> Are Here', 'Handcrafted jackets with premium materials. Limited stock available.', 'Shop Jackets', 'shop.html?category=Jackets', 'Learn More', '#', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=600&q=80', 3, true);

-- Add trigger for hero_slides updated_at
CREATE TRIGGER update_hero_slides_updated_at BEFORE UPDATE ON hero_slides
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
