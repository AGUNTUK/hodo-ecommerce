-- ============================================
-- ENHANCED BANNER SYSTEM
-- ============================================

-- Create hero_slides table if it doesn't exist
CREATE TABLE IF NOT EXISTS hero_slides (
  id SERIAL PRIMARY KEY,
  eyebrow VARCHAR(255),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  button_text VARCHAR(100),
  button_link VARCHAR(255),
  secondary_button_text VARCHAR(100),
  secondary_button_link VARCHAR(255),
  image TEXT NOT NULL,
  video_url TEXT,
  media_type VARCHAR(20) DEFAULT 'image',
  position VARCHAR(50) DEFAULT 'homepage_hero',
  "order" INTEGER DEFAULT 1,
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on hero_slides
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

-- Drop existing policies and create new ones
DROP POLICY IF EXISTS "Hero slides are viewable by everyone" ON hero_slides;
DROP POLICY IF EXISTS "Anyone can view active hero slides" ON hero_slides;
DROP POLICY IF EXISTS "Only admins can insert hero slides" ON hero_slides;
DROP POLICY IF EXISTS "Only admins can update hero slides" ON hero_slides;
DROP POLICY IF EXISTS "Only admins can delete hero slides" ON hero_slides;

-- Hero slides are readable by everyone (including scheduled ones for admin)
CREATE POLICY "Hero slides are viewable by everyone" ON hero_slides
  FOR SELECT USING (true);

-- Only admins can insert/update/delete hero slides
CREATE POLICY "Only admins can insert hero slides" ON hero_slides
  FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can update hero slides" ON hero_slides
  FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');

CREATE POLICY "Only admins can delete hero slides" ON hero_slides
  FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');

-- Create indexes for better performance on position queries
CREATE INDEX IF NOT EXISTS idx_hero_slides_position ON hero_slides(position);
CREATE INDEX IF NOT EXISTS idx_hero_slides_active ON hero_slides(is_active);
CREATE INDEX IF NOT EXISTS idx_hero_slides_dates ON hero_slides(start_date, end_date);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_hero_slides_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_hero_slides_updated_at ON hero_slides;
CREATE TRIGGER update_hero_slides_updated_at BEFORE UPDATE ON hero_slides
  FOR EACH ROW EXECUTE FUNCTION update_hero_slides_updated_at();

-- Seed initial hero slides data
INSERT INTO hero_slides (eyebrow, title, subtitle, description, button_text, button_link, secondary_button_text, secondary_button_link, image, media_type, position, "order", is_active) VALUES
('New Collection 2026', 'Elevate Your Style', 'Premium menswear crafted for the modern gentleman', 'Discover our latest collection of refined essentials designed for the contemporary man.', 'Shop Now', '#shopGrid', 'Contact Us', '#contact-panel', 'https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1920&q=80', 'image', 'homepage_hero', 1, true),
('Summer Essentials', 'Sharp Looks for Hot Days', 'Lightweight fabrics meet bold designs', 'Stay cool and stylish this summer with our breathable collection.', 'Explore Summer', 'shop.html?category=Shirts', 'View Lookbook', '#', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?auto=format&fit=crop&w=1920&q=80', 'image', 'homepage_hero', 2, true),
('Limited Edition', 'Exclusive Jackets Are Here', 'Handcrafted with premium materials', 'Limited stock available for our exclusive jacket collection.', 'Shop Jackets', 'shop.html?category=Jackets', 'Learn More', '#', 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1920&q=80', 'image', 'homepage_hero', 3, true);
