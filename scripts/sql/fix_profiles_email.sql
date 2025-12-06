-- Add email column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'email'
  ) THEN
    ALTER TABLE profiles ADD COLUMN email VARCHAR(255);
    RAISE NOTICE 'Email column added to profiles table';
  ELSE
    RAISE NOTICE 'Email column already exists in profiles table';
  END IF;
END $$;

-- Add name column to profiles table if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'name'
  ) THEN
    ALTER TABLE profiles ADD COLUMN name VARCHAR(255);
    RAISE NOTICE 'Name column added to profiles table';
  ELSE
    RAISE NOTICE 'Name column already exists in profiles table';
  END IF;
END $$;

-- Add avatar column to profiles table if it doesn't exist (as alias for avatar_image)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'profiles' 
    AND column_name = 'avatar'
  ) THEN
    ALTER TABLE profiles ADD COLUMN avatar TEXT;
    RAISE NOTICE 'Avatar column added to profiles table';
  ELSE
    RAISE NOTICE 'Avatar column already exists in profiles table';
  END IF;
END $$;

-- Update RLS policies to ensure public access
DROP POLICY IF EXISTS "Allow public read access" ON profiles;
CREATE POLICY "Allow public read access" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON profiles;
CREATE POLICY "Allow public insert" ON profiles FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON profiles;
CREATE POLICY "Allow public update" ON profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Allow public delete" ON profiles;
CREATE POLICY "Allow public delete" ON profiles FOR DELETE USING (true);

-- Create index on email for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_name ON profiles(user_name);

