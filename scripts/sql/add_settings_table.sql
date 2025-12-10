-- Create settings table for storing site configuration
CREATE TABLE IF NOT EXISTS settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  key VARCHAR(255) NOT NULL UNIQUE,
  value TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on settings table
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Create policies for settings
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Allow public read access') THEN
    CREATE POLICY "Allow public read access" ON settings FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Allow authenticated users to update') THEN
    CREATE POLICY "Allow authenticated users to update" ON settings FOR UPDATE USING (true) WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'settings' AND policyname = 'Allow authenticated users to insert') THEN
    CREATE POLICY "Allow authenticated users to insert" ON settings FOR INSERT WITH CHECK (true);
  END IF;
END $$;

-- Insert default settings
INSERT INTO settings (key, value) VALUES ('homepage_background_image', NULL)
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES ('homepage_hero_title', 'Welcome to AdultTube')
ON CONFLICT (key) DO NOTHING;

INSERT INTO settings (key, value) VALUES ('homepage_hero_subtitle', 'Premium Adult Content')
ON CONFLICT (key) DO NOTHING;

