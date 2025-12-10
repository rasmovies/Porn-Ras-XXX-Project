-- Update existing tables to add missing columns
-- Run this in Supabase SQL Editor

-- Update categories table (add thumbnail if not exists)
ALTER TABLE categories ADD COLUMN IF NOT EXISTS thumbnail TEXT;

-- Update comments table (add dislikes if not exists)
ALTER TABLE comments ADD COLUMN IF NOT EXISTS dislikes INTEGER DEFAULT 0;

-- Create channels table if not exists
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

-- Create policies for channels
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'channels' AND policyname = 'Allow public read access') THEN
    CREATE POLICY "Allow public read access" ON channels FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'channels' AND policyname = 'Allow public insert') THEN
    CREATE POLICY "Allow public insert" ON channels FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'channels' AND policyname = 'Allow public update') THEN
    CREATE POLICY "Allow public update" ON channels FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'channels' AND policyname = 'Allow public delete') THEN
    CREATE POLICY "Allow public delete" ON channels FOR DELETE USING (true);
  END IF;
END $$;

