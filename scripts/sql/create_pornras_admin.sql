-- ============================================
-- Pornras Admin Kullanıcı Oluşturma Script'i
-- ============================================
-- Bu script admin kullanıcısını oluşturur:
-- 1. profiles tablosunu oluşturur (yoksa)
-- 2. profiles tablosuna admin kullanıcısını ekler
-- 3. admin_users tablosunu oluşturur (yoksa)
-- 4. admin_users tablosuna admin kullanıcısını ekler
-- 5. Supabase Auth'a eklemek için manuel adımlar içerir
--
-- Kullanım: Supabase Dashboard → SQL Editor → Bu script'i çalıştırın
-- ============================================

-- Step 0: profiles tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255),
  name VARCHAR(255),
  password_hash TEXT,
  banner_image TEXT,
  avatar_image TEXT,
  avatar TEXT,
  subscriber_count INTEGER DEFAULT 0,
  videos_watched INTEGER DEFAULT 0,
  email_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles (if they don't exist)
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

-- Create indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_user_name ON profiles(user_name);

-- Step 1: profiles tablosunda admin kullanıcısını oluştur/güncelle
DO $$ 
BEGIN
  -- Check if admin user exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE user_name = 'Pornras Admin') THEN
    -- Create admin profile
    INSERT INTO profiles (
      user_name,
      email,
      name,
      banner_image,
      avatar_image,
      subscriber_count,
      videos_watched,
      email_verified,
      created_at,
      updated_at
    ) VALUES (
      'Pornras Admin',
      'admin@pornras.com',
      'Pornras Admin',
      NULL,
      NULL,
      0,
      0,
      true,
      NOW(),
      NOW()
    );
    
    RAISE NOTICE '✅ Admin user "Pornras Admin" created in profiles table';
  ELSE
    -- Update existing admin user
    UPDATE profiles 
    SET 
      email = 'admin@pornras.com',
      name = 'Pornras Admin',
      email_verified = true,
      updated_at = NOW()
    WHERE user_name = 'Pornras Admin';
    
    RAISE NOTICE '✅ Admin user "Pornras Admin" updated in profiles table';
  END IF;
END $$;

-- Step 2: admin_users tablosunu oluştur (eğer yoksa)
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_name VARCHAR(255) NOT NULL UNIQUE,
  is_admin BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Step 3: RLS politikalarını ayarla (eğer yoksa)
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access" ON admin_users;
DROP POLICY IF EXISTS "Allow public insert" ON admin_users;
DROP POLICY IF EXISTS "Allow public update" ON admin_users;

-- Create new policies
CREATE POLICY "Allow public read access" ON admin_users FOR SELECT USING (true);
CREATE POLICY "Allow public insert" ON admin_users FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update" ON admin_users FOR UPDATE USING (true);

-- Step 4: admin_users tablosuna admin kullanıcısını ekle
DO $$
BEGIN
  INSERT INTO admin_users (user_name, is_admin, created_at, updated_at)
  VALUES ('Pornras Admin', true, NOW(), NOW())
  ON CONFLICT (user_name) 
  DO UPDATE SET 
    is_admin = true,
    updated_at = NOW();
  
  RAISE NOTICE '✅ Admin user added to admin_users table';
END $$;

-- Step 5: Kontrol - Admin kullanıcısını göster
SELECT 
  'Profiles' as table_name,
  user_name,
  email,
  name,
  email_verified
FROM profiles 
WHERE user_name = 'Pornras Admin'

UNION ALL

SELECT 
  'Admin Users' as table_name,
  user_name::text,
  NULL as email,
  NULL as name,
  is_admin::boolean as email_verified
FROM admin_users 
WHERE user_name = 'Pornras Admin';

-- ============================================
-- ÖNEMLİ: Supabase Auth'a Manuel Ekleme
-- ============================================
-- Bu script profiles ve admin_users tablolarına ekler,
-- ancak Supabase Auth'a eklemek için manuel adımlar gerekir:
--
-- 1. Supabase Dashboard → Authentication → Users
-- 2. "Add User" → "Create new user"
-- 3. Email: admin@pornras.com
-- 4. Password: 1qA2ws3ed*
-- 5. "Auto Confirm User" seçeneğini işaretle
-- 6. "Create user" butonuna tıkla
--
-- VEYA
--
-- API endpoint kullan:
-- POST /api/auth/create-admin
-- Body: {
--   "username": "Pornras Admin",
--   "email": "admin@pornras.com",
--   "password": "1qA2ws3ed*"
-- }
-- ============================================

