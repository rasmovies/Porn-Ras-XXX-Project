-- AdultTube Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  thumbnail TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Models table
CREATE TABLE models (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  image TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Videos table
CREATE TABLE videos (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  thumbnail TEXT,
  streamtape_url TEXT,
  duration VARCHAR(10),
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  model_id UUID REFERENCES models(id) ON DELETE SET NULL,
  views INTEGER DEFAULT 0,
  likes INTEGER DEFAULT 0,
  dislikes INTEGER DEFAULT 0,
  slug VARCHAR(255) UNIQUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Comments table
CREATE TABLE comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  video_id UUID REFERENCES videos(id) ON DELETE CASCADE,
  author VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  likes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Function to increment video views
CREATE OR REPLACE FUNCTION increment_views(video_id UUID)
RETURNS void AS $$
BEGIN
  UPDATE videos 
  SET views = views + 1 
  WHERE id = video_id;
END;
$$ LANGUAGE plpgsql;

-- Function to generate slug from title
CREATE OR REPLACE FUNCTION generate_slug(title TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN lower(regexp_replace(regexp_replace(title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g'));
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-generate slug for videos
CREATE OR REPLACE FUNCTION set_video_slug()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    NEW.slug := generate_slug(NEW.title);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_video_slug_trigger
  BEFORE INSERT OR UPDATE ON videos
  FOR EACH ROW
  EXECUTE FUNCTION set_video_slug();

-- Row Level Security (RLS) policies
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE models ENABLE ROW LEVEL SECURITY;
ALTER TABLE videos ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;

-- Allow public read access to all tables
CREATE POLICY "Allow public read access" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON models FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON videos FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON comments FOR SELECT USING (true);

-- Allow public insert/update/delete for now (you can restrict this later)
CREATE POLICY "Allow public insert" ON categories FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON categories FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON categories FOR DELETE USING (true);

CREATE POLICY "Allow public insert" ON models FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON models FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON models FOR DELETE USING (true);

CREATE POLICY "Allow public insert" ON videos FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON videos FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON videos FOR DELETE USING (true);

CREATE POLICY "Allow public insert" ON comments FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON comments FOR UPDATE USING (true);
CREATE POLICY "Allow public delete" ON comments FOR DELETE USING (true);

-- Insert some sample data
INSERT INTO categories (name, thumbnail) VALUES 
('Entertainment', 'https://via.placeholder.com/200x120/ff6b6b/ffffff?text=Entertainment'),
('Music', 'https://via.placeholder.com/200x120/4ecdc4/ffffff?text=Music'),
('Gaming', 'https://via.placeholder.com/200x120/45b7d1/ffffff?text=Gaming'),
('Education', 'https://via.placeholder.com/200x120/96ceb4/ffffff?text=Education'),
('Sports', 'https://via.placeholder.com/200x120/ff6b6b/ffffff?text=Sports'),
('Travel', 'https://via.placeholder.com/200x120/4ecdc4/ffffff?text=Travel');

INSERT INTO models (name, image) VALUES 
('Emma Stone', 'https://via.placeholder.com/200x250/ff6b6b/ffffff?text=Emma'),
('John Doe', 'https://via.placeholder.com/200x250/4ecdc4/ffffff?text=John'),
('Jane Smith', 'https://via.placeholder.com/200x250/45b7d1/ffffff?text=Jane');

-- Create indexes for better performance
CREATE INDEX idx_videos_category_id ON videos(category_id);
CREATE INDEX idx_videos_model_id ON videos(model_id);
CREATE INDEX idx_videos_slug ON videos(slug);
CREATE INDEX idx_comments_video_id ON comments(video_id);
CREATE INDEX idx_videos_created_at ON videos(created_at DESC);





