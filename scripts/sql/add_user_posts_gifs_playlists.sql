-- Create user_posts table for profile posts
CREATE TABLE IF NOT EXISTS user_posts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_posts
ALTER TABLE user_posts ENABLE ROW LEVEL SECURITY;

-- Create policies for user_posts
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_posts' AND policyname = 'Allow public read access') THEN
    CREATE POLICY "Allow public read access" ON user_posts FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_posts' AND policyname = 'Allow public insert') THEN
    CREATE POLICY "Allow public insert" ON user_posts FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_posts' AND policyname = 'Allow public update') THEN
    CREATE POLICY "Allow public update" ON user_posts FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_posts' AND policyname = 'Allow public delete') THEN
    CREATE POLICY "Allow public delete" ON user_posts FOR DELETE USING (true);
  END IF;
END $$;

-- Create user_gifs table with admin approval
CREATE TABLE IF NOT EXISTS user_gifs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  gif_url TEXT,
  gif_file_base64 TEXT,
  is_approved BOOLEAN DEFAULT false,
  approved_by VARCHAR(255),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_gifs
ALTER TABLE user_gifs ENABLE ROW LEVEL SECURITY;

-- Create policies for user_gifs
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_gifs' AND policyname = 'Allow public read approved') THEN
    CREATE POLICY "Allow public read approved" ON user_gifs FOR SELECT USING (is_approved = true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_gifs' AND policyname = 'Allow public insert') THEN
    CREATE POLICY "Allow public insert" ON user_gifs FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_gifs' AND policyname = 'Allow admin update') THEN
    CREATE POLICY "Allow admin update" ON user_gifs FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_gifs' AND policyname = 'Allow admin delete') THEN
    CREATE POLICY "Allow admin delete" ON user_gifs FOR DELETE USING (true);
  END IF;
END $$;

-- Create user_playlists table
CREATE TABLE IF NOT EXISTS user_playlists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL,
  playlist_name VARCHAR(255) NOT NULL,
  video_ids TEXT[] DEFAULT ARRAY[]::TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_playlists
ALTER TABLE user_playlists ENABLE ROW LEVEL SECURITY;

-- Create policies for user_playlists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_playlists' AND policyname = 'Allow public read access') THEN
    CREATE POLICY "Allow public read access" ON user_playlists FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_playlists' AND policyname = 'Allow public insert') THEN
    CREATE POLICY "Allow public insert" ON user_playlists FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_playlists' AND policyname = 'Allow public update') THEN
    CREATE POLICY "Allow public update" ON user_playlists FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_playlists' AND policyname = 'Allow public delete') THEN
    CREATE POLICY "Allow public delete" ON user_playlists FOR DELETE USING (true);
  END IF;
END $$;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_posts_user_name ON user_posts(user_name);
CREATE INDEX IF NOT EXISTS idx_user_gifs_user_name ON user_gifs(user_name);
CREATE INDEX IF NOT EXISTS idx_user_gifs_approved ON user_gifs(is_approved);
CREATE INDEX IF NOT EXISTS idx_user_playlists_user_name ON user_playlists(user_name);

