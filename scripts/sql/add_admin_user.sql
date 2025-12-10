-- Step 1: Create admin_users table FIRST
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 2: Enable RLS on admin_users table
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Step 3: Create policies for admin_users
DROP POLICY IF EXISTS "Allow public read access" ON admin_users;
CREATE POLICY "Allow public read access" ON admin_users FOR SELECT USING (true);

DROP POLICY IF EXISTS "Allow public insert" ON admin_users;
CREATE POLICY "Allow public insert" ON admin_users FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update" ON admin_users;
CREATE POLICY "Allow public update" ON admin_users FOR UPDATE USING (true);

-- Step 4: Add admin user to profiles table
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_name = 'Pornras Admin') THEN
    INSERT INTO profiles (
      user_name,
      banner_image,
      avatar_image,
      subscriber_count,
      videos_watched,
      created_at,
      updated_at
    ) VALUES (
      'Pornras Admin',
      NULL,
      NULL,
      0,
      0,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE 'Admin user "Pornras Admin" created in profiles table';
  ELSE
    RAISE NOTICE 'Admin user "Pornras Admin" already exists in profiles table';
  END IF;
END $$;

-- Step 5: Add admin user to admin_users table
INSERT INTO admin_users (user_name, is_admin, created_at, updated_at)
VALUES ('Pornras Admin', true, NOW(), NOW())
ON CONFLICT (user_name) DO UPDATE SET is_admin = true;

-- Step 6: Display admin users
SELECT * FROM admin_users WHERE user_name = 'Pornras Admin';
