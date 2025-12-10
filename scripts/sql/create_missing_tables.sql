-- ============================================
-- Eksik Tabloları Oluşturma Script'i
-- ============================================
-- Bu script Supabase'de eksik olan tabloları oluşturur:
-- 1. models tablosu
-- 2. channels tablosu
--
-- Kullanım: Supabase Dashboard → SQL Editor → Bu script'i çalıştırın
-- ============================================

-- ============================================
-- 1. MODELS TABLOSU
-- ============================================

CREATE TABLE IF NOT EXISTS models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on models table
ALTER TABLE models ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON models;
DROP POLICY IF EXISTS "Allow public insert" ON models;
DROP POLICY IF EXISTS "Allow public update" ON models;
DROP POLICY IF EXISTS "Allow public delete" ON models;

-- Create policies for models
CREATE POLICY "Allow public read access" ON models FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON models FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON models FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON models FOR DELETE USING (true);

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_models_name ON models(name);
CREATE INDEX IF NOT EXISTS idx_models_created_at ON models(created_at);

DO $$ 
BEGIN
  RAISE NOTICE '✅ Models table created successfully';
END $$;

-- ============================================
-- 2. CHANNELS TABLOSU
-- ============================================

CREATE TABLE IF NOT EXISTS channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  thumbnail TEXT,
  banner TEXT,
  subscriber_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on channels table
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON channels;
DROP POLICY IF EXISTS "Allow public insert" ON channels;
DROP POLICY IF EXISTS "Allow public update" ON channels;
DROP POLICY IF EXISTS "Allow public delete" ON channels;

-- Create policies for channels
CREATE POLICY "Allow public read access" ON channels FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON channels FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON channels FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON channels FOR DELETE USING (true);

-- Create index on name for faster searches
CREATE INDEX IF NOT EXISTS idx_channels_name ON channels(name);
CREATE INDEX IF NOT EXISTS idx_channels_created_at ON channels(created_at);

DO $$ 
BEGIN
  RAISE NOTICE '✅ Channels table created successfully';
END $$;

-- ============================================
-- 3. KONTROL
-- ============================================

-- Check if tables exist
SELECT 
  'models' as table_name,
  COUNT(*) as row_count
FROM models

UNION ALL

SELECT 
  'channels' as table_name,
  COUNT(*) as row_count
FROM channels;

DO $$ 
BEGIN
  RAISE NOTICE '✅ Script completed successfully!';
END $$;

