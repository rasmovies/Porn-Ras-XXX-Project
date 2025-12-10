-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL UNIQUE,
  banner_image TEXT,
  avatar_image TEXT,
  subscriber_count INTEGER DEFAULT 0,
  videos_watched INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow public read access') THEN
    CREATE POLICY "Allow public read access" ON profiles FOR SELECT USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow public insert') THEN
    CREATE POLICY "Allow public insert" ON profiles FOR INSERT WITH CHECK (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow public update') THEN
    CREATE POLICY "Allow public update" ON profiles FOR UPDATE USING (true);
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'profiles' AND policyname = 'Allow public delete') THEN
    CREATE POLICY "Allow public delete" ON profiles FOR DELETE USING (true);
  END IF;
END $$;





